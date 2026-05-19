let currentSlideIndex = 1;
let currentPresName = "";

function sendCommand(action, index = null) {
    fetch('/static/../command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action, index: index })
    }).catch(err => console.error("Error sending command:", err));
}

async function openSlidesModal() {
    document.getElementById('slides-modal').classList.remove('hidden');
    const listEl = document.getElementById('slides-list');
    listEl.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa;">Loading slides...</div>';
    try {
        const res = await fetch('/static/../slides_info');
        const slides = await res.json();
        listEl.innerHTML = '';
        slides.forEach(s => {
            const div = document.createElement('div');
            div.className = 'slide-item';
            if (s.index === currentSlideIndex) {
                div.style.backgroundColor = '#3d3d3d';
                div.style.borderLeft = '4px solid #bb86fc';
                div.id = 'current-slide-item';
            }
            div.onclick = () => {
                sendCommand('goto', s.index);
                closeSlidesModal();
            };
            const img = document.createElement('img');
            img.src = '/static/../slide_thumb/' + s.index + '?p=' + encodeURIComponent(currentPresName || Date.now());
            img.onerror = () => { img.style.display = 'none'; };
            const span = document.createElement('span');
            span.textContent = s.index + '. ' + s.title;
            div.appendChild(img);
            div.appendChild(span);
            listEl.appendChild(div);
        });
        
        setTimeout(() => {
            const currentItem = document.getElementById('current-slide-item');
            if (currentItem) {
                currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    } catch(e) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px; color:#ff5e7e;">Error loading slides.</div>';
    }
}

function closeSlidesModal() {
    document.getElementById('slides-modal').classList.add('hidden');
}

let currentSlideHash = "";

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    const statusEl = document.getElementById('connection-status');
    
    ws.onopen = () => {
        statusEl.textContent = 'Connected';
        statusEl.style.color = '#a277ff'; // primary color
    };
    
    ws.onmessage = (event) => {
        const state = JSON.parse(event.data);
        
        if (state.is_running) {
            currentSlideIndex = state.current_slide;
            currentPresName = state.pres_name || "";
            document.getElementById('not-running-msg').style.display = 'none';
            document.getElementById('slide-indicator').textContent = `Slide: ${state.current_slide} / ${state.total_slides}`;
            
            const newHash = state.current_slide + "-" + state.is_running + "-" + (state.pres_name || "");
            
            const currImg = document.getElementById('current-slide-img');
            if (state.current_image) {
                if (currentSlideHash !== newHash) {
                    currImg.src = state.current_image;
                }
                currImg.style.display = 'block';
            } else {
                currImg.style.display = 'none';
            }
            
            const nextImg = document.getElementById('next-slide-img');
            if (state.next_image) {
                if (currentSlideHash !== newHash) {
                    nextImg.src = state.next_image;
                }
                nextImg.style.display = 'block';
            } else {
                nextImg.style.display = 'none';
            }
            
            document.getElementById('notes-content').textContent = state.notes || 'No notes available for this slide.';
            
            if (state.is_blank) {
                document.getElementById('current-slide-img').style.opacity = '0.2';
                const blankBtn = document.getElementById('blank-btn');
                if(blankBtn) {
                    blankBtn.classList.add('active-blank');
                }
            } else {
                document.getElementById('current-slide-img').style.opacity = '1';
                const blankBtn = document.getElementById('blank-btn');
                if(blankBtn) {
                    blankBtn.classList.remove('active-blank');
                }
            }
            
            currentSlideHash = newHash;
        } else {
            document.getElementById('not-running-msg').style.display = 'block';
            document.getElementById('current-slide-img').style.display = 'none';
            document.getElementById('next-slide-img').style.display = 'none';
            document.getElementById('slide-indicator').textContent = 'Slide: - / -';
            document.getElementById('notes-content').textContent = 'Start the presentation to see notes.';
        }
    };
    
    ws.onclose = () => {
        statusEl.textContent = 'Disconnected. Reconnecting...';
        statusEl.style.color = '#ff5e7e';
        setTimeout(connectWebSocket, 2000);
    };
    
    ws.onerror = (err) => {
        console.error("WebSocket error:", err);
    };
}

connectWebSocket();
