// 1. Programmatic Smooth Scroll (Lenis.js) safely wrapped
// let lenis = null;
// if (typeof Lenis !== 'undefined') {
//     lenis = new Lenis({
//         duration: 1.4,
//         wheelMultiplier: 0.9,
//         touchMultiplier: 1.5,
//         infinite: false,
//     });

//     function lenisRaf(time) {
//         if (lenis) lenis.raf(time);
//         requestAnimationFrame(lenisRaf);
//     }
//     requestAnimationFrame(lenisRaf);
// }

// Handle hash navigation on load or scroll to top
window.addEventListener('load', () => {
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target && lenis) {
            lenis.scrollTo(target);
        }
    } else {
        window.scrollTo(0, 0);
        if (lenis) lenis.scrollTo(0, { immediate: true });
    }
});

// 2. WebGL / Three.js 3D Background Engine
let scene, camera, renderer, particleSystem, floatingNodes = [];
let targetMouseX = 0, targetMouseY = 0;
let mouseX = 0, mouseY = 0;
let animationFrameId = null;
const clock = new THREE.Clock();

function initWebGL() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            alpha: true, 
            antialias: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const particleCount = 400;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorAmber = new THREE.Color(0xD97706);
        const colorBronze = new THREE.Color(0xB45309);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 80;
            positions[i + 1] = (Math.random() - 0.5) * 80;
            positions[i + 2] = (Math.random() - 0.5) * 80;

            const mixedColor = colorAmber.clone().lerp(colorBronze, Math.random());
            colors[i] = mixedColor.r;
            colors[i + 1] = mixedColor.g;
            colors[i + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.35,
            vertexColors: true,
            transparent: true,
            opacity: 0.65
        });

        particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        const nodeGeometry = new THREE.IcosahedronGeometry(1.2, 0);
        const nodeMaterial = new THREE.MeshBasicMaterial({
            color: 0xD97706,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });

        floatingNodes = [];
        for (let i = 0; i < 8; i++) {
            const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            mesh.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            scene.add(mesh);
            floatingNodes.push(mesh);
        }

        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
    } catch (e) {
        console.warn("WebGL initialization skipped:", e);
    }
}

function onMouseMove(event) {
    targetMouseX = (event.clientX - window.innerWidth / 2) / window.innerWidth;
    targetMouseY = (event.clientY - window.innerHeight / 2) / window.innerHeight;
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Cache parallax elements once so the DOM isn't searched 60 times/sec
let parallaxElements = null;

function animateWebGL() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    const delta = clock.getDelta();

    mouseX += (targetMouseX - mouseX) * (3.0 * delta);
    mouseY += (targetMouseY - mouseY) * (3.0 * delta);

    const scrollY = window.scrollY * 0.001;

    if (particleSystem) {
        particleSystem.rotation.y += 0.03 * delta;
        particleSystem.rotation.x = mouseY * 0.15 + scrollY;
        particleSystem.rotation.y += mouseX * 0.05 * delta;
    }

    floatingNodes.forEach((node, index) => {
        node.rotation.x += 0.06 * delta * (index % 2 === 0 ? 1 : -1);
        node.rotation.y += 0.08 * delta * (index % 2 === 0 ? -1 : 1);
        node.position.y += Math.sin(Date.now() * 0.0008 + index) * (0.18 * delta);
    });

    if (renderer && scene && camera) {
        // Skips mobile (<768px) and reduced-motion preference
        if (window.innerWidth >= 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (!parallaxElements) {
                parallaxElements = document.querySelectorAll('.data-parallax'); // Cache once
            }
            const currentScrollY = window.scrollY;
            parallaxElements.forEach(el => {
                const speed = parseFloat(el.getAttribute('data-speed') || 0.05);
                el.style.transform = `translateY(${currentScrollY * speed * -1}px)`;
            });
        }
        renderer.render(scene, camera);
    }

    animationFrameId = requestAnimationFrame(animateWebGL);
}

// Initialize WebGL Scene
window.addEventListener('load', () => {
    initWebGL();
    animateWebGL();
});

// 3. 3D Tilt Card Effect
document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        card.style.transform = `perspective(1000px) rotateX(${-y / 25}deg) rotateY(${x / 25}deg) translateZ(6px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    });
});

// 4. Parallax Scroll Effect
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    document.querySelectorAll('.data-parallax').forEach(el => {
        const speed = parseFloat(el.getAttribute('data-speed') || 0.05);
        el.style.transform = `translateY(${scrollY * speed * -1}px)`;
    });
});

// 5. Mobile Menu Toggle
const menuBtn = document.getElementById('menuToggle');
if (menuBtn) {
    menuBtn.addEventListener('click', function() {
        const dropdown = document.getElementById('mobileDropdown');
        if (dropdown) dropdown.classList.toggle('hidden');
    });
}

// 6. Reference Filter Tabs
const filterBtns = document.querySelectorAll('.ref-filter-btn');
const refCards = document.querySelectorAll('.ref-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
            b.className = "ref-filter-btn px-4 py-2 rounded glass-card-light text-charcoalMuted hover:text-amberGold font-medium";
        });
        btn.className = "ref-filter-btn px-4 py-2 rounded bg-amberGold text-white font-bold";

        const filter = btn.getAttribute('data-filter');

        refCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-bank') === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// 7. Counter Animation
const countUpObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseInt(counter.getAttribute('data-target'), 10);
            const duration = 1200;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.innerText = target;
                    clearInterval(timer);
                } else {
                    counter.innerText = Math.ceil(current);
                }
            }, stepTime);

            observer.unobserve(counter);
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.counter').forEach(counter => {
    countUpObserver.observe(counter);
});

// 8. Send Contact Form Data directly to WhatsApp
const formEl = document.getElementById('enquiryForm');
if (formEl) {
    formEl.addEventListener('submit', function(e) {
        e.preventDefault();

        const whatsappNumber = "918179353536";
        const inputs = this.querySelectorAll('input');
        const name = inputs[0] ? inputs[0].value : '';
        const company = inputs[1] ? inputs[1].value : '';
        const phone = inputs[2] ? inputs[2].value : '';
        const email = inputs[3] ? inputs[3].value : '';
        const message = this.querySelector('textarea') ? this.querySelector('textarea').value : '';

        const formattedText = 
            `*New Portfolio Enquiry - Sri Sai Dhanada Enterprises*\n\n` +
            `*Name:* ${name}\n` +
            `*Company / Bank:* ${company}\n` +
            `*Phone:* ${phone}\n` +
            `*Email:* ${email}\n` +
            `*Message:* ${message ? message : 'N/A'}`;

        const encodedMessage = encodeURIComponent(formattedText);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        this.reset();
    });
}

// 9. Side Marquee Partner Data & Engine
const bankPartners = [
    { name: "ICICI Bank", file: "icici.png", domain: "icicibank.com", segment: "Credit Cards · PL · BL · CD", pool: "₹52 Cr+", bucket: "Bkt X–6 & 180+ DPD", coverage: "AP & Telangana" },
    { name: "State Bank of India", file: "sbi.png", domain: "sbi.co.in", segment: "Consumer Durable 180+", pool: "₹16 Cr", bucket: "CD2 · 180+ DPD", coverage: "Overall AP" },
    { name: "Axis Bank", file: "axis.png", domain: "axisbank.com", segment: "Credit Cards · PL · BL", pool: "₹14 Cr", bucket: "Bkt X · 180+ DPD", coverage: "Overall AP" },
    { name: "RBL Bank", file: "rbl.png", domain: "rbl.png", segment: "Credit Cards", pool: "₹7.5 Cr", bucket: "Bkt 2, 4, 5, 6", coverage: "VJA · Vizag · Guntur" },
    { name: "IDFC First Bank", file: "idfc.png", domain: "idfcfirstbank.com", segment: "PL Cross-Sell", pool: "₹11 Cr", bucket: "X Bucket", coverage: "Guntur & Visakhapatnam" },
    { name: "Home Credit", file: "home credit.png", domain: "homecredit.co.in", segment: "Business Loans", pool: "₹5 Cr", bucket: "180+ DPD", coverage: "Visakhapatnam" },
    { name: "Kinara Capital", file: "kinara.png", domain: "kinaracapital.com", segment: "Business Loans", pool: "₹10 Cr", bucket: "Mixed Buckets", coverage: "Overall AP" },
    { name: "Lendingkart", file: "lendingkart.png", domain: "lendingkart.com", segment: "Business Loans", pool: "₹14 Cr", bucket: "30 & 180+ DPD", coverage: "Overall AP" },
    { name: "Piramal Finance", file: "piramal.png", domain: "piramalfinance.com", segment: "Personal Loans", pool: "₹8 Cr", bucket: "Bkt 2, 4", coverage: "~240 active cases" },
    { name: "Navi", file: "navi.png", domain: "navi.com", segment: "Personal Loans", pool: "₹7 Cr", bucket: "30 – 180+ DPD", coverage: "~900 active cases" },
    { name: "TVS Credit", file: "tvs.png", domain: "tvscredit.com", segment: "Personal Loans", pool: "₹8 Cr", bucket: "Bkt 4, 5, 6 & 180+", coverage: "~1,800 active cases" },
    { name: "OneCard / IARC", file: "one card.png", domain: "getonecard.app", segment: "Personal Loans", pool: "₹7 Cr", bucket: "180+ DPD", coverage: "~2,000 active cases" }
];

function createMarqueeLogoNode(bank, tooltipDirection) {
    const card = document.createElement('div');
    card.className = 'marquee-logo-card group relative';

    card.innerHTML = `
        <img src="logo/${bank.file}" 
            alt="${bank.name}" 
            class="w-full h-full object-contain" 
            onerror="this.src='https://www.google.com/s2/favicons?domain=${bank.domain}&sz=64'"
            loading="lazy">
    `;

    card.addEventListener('mouseenter', () => {
        const tooltip = document.getElementById('globalLogoTooltip');
        if (!tooltip) return;

        const rect = card.getBoundingClientRect();

        // 20% Reduced Popup Content
        tooltip.innerHTML = `
            <div class="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-white/15">
                <img src="logo/${bank.file}" class="w-6 h-6 object-contain" onerror="this.src='https://www.google.com/s2/favicons?domain=${bank.domain}&sz=64'">
                <div>
                    <span class="font-heading font-bold text-xs text-white block leading-tight">${bank.name}</span>
                    <span class="font-mono text-[9.5px] text-amberGold uppercase font-semibold">National Partner</span>
                </div>
            </div>
            <div class="space-y-2 font-mono text-xs">
                <div class="flex justify-between items-center bg-white/5 p-1.5 rounded-lg border border-white/10">
                    <span class="text-slate-300 font-sans text-xs">Active Managed Pool:</span>
                    <span class="text-amberGold font-bold text-xs font-mono">${bank.pool}</span>
                </div>
                <div class="flex justify-between items-center text-[11px]">
                    <span class="text-slate-400 font-sans">Loan Segment:</span>
                    <span class="text-slate-200 font-sans font-semibold">${bank.segment}</span>
                </div>
                <div class="flex justify-between items-center text-[11px]">
                    <span class="text-slate-400 font-sans">Bucket Stage:</span>
                    <span class="text-slate-200 font-mono">${bank.bucket}</span>
                </div>
                <div class="flex justify-between items-center pt-1.5 border-t border-white/10 text-[11px]">
                    <span class="text-slate-400 font-sans">Regional Coverage:</span>
                    <span class="text-amberGold font-semibold font-sans">${bank.coverage}</span>
                </div>
            </div>
        `;

        // 256px Width (Matching w-64 in CSS)
        const tooltipWidth = 256;

        // Vertical Centering
        let topPos = rect.top + (rect.height / 2) - 80;
        topPos = Math.max(15, Math.min(window.innerHeight - 220, topPos));

        // Precise Horizontal Positioning
        let leftPos;
        if (tooltipDirection === 'right') {
            leftPos = rect.right + 12; // 12px gap to the right of left sidebar
        } else {
            leftPos = rect.left - tooltipWidth - 12; // 12px gap to the left of right sidebar
        }

        tooltip.style.top = `${topPos}px`;
        tooltip.style.left = `${leftPos}px`;
        tooltip.classList.remove('hidden');
    });

    card.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('globalLogoTooltip');
        if (tooltip) tooltip.classList.add('hidden');
    });

    return card;
}

function buildVerticalMarquees() {
    const trackLeft = document.getElementById('marqueeTrackLeft');
    const trackRight = document.getElementById('marqueeTrackRight');

    if (!trackLeft || !trackRight) return;

    trackLeft.innerHTML = '';
    trackRight.innerHTML = '';

    const infinitePartners = [...bankPartners, ...bankPartners, ...bankPartners];

    infinitePartners.forEach(bank => {
        trackLeft.appendChild(createMarqueeLogoNode(bank, 'right'));
    });

    infinitePartners.forEach(bank => {
        trackRight.appendChild(createMarqueeLogoNode(bank, 'left'));
    });
}

window.addEventListener('DOMContentLoaded', buildVerticalMarquees);

// ====================================
// MAP PIN HOVER ADDRESS POP-UP ENGINE
// ====================================
const mapBranchAddresses = {
    'vizag-hq': {
        title: "Visakhapatnam Head Office",
        address: "D.No. 39-11-5, Sri Srinivasa Towers, AXIS Bank Upstairs, 4th Floor, Murali Nagar, Visakhapatnam – 530007"
    },
    'vizag-2': {
        title: "Visakhapatnam — Madhavadhara II",
        address: "Madhavadhara Phase II, Visakhapatnam, Andhra Pradesh"
    },
    'bhubaneswar': {
        title: "Bhubaneswar Branch",
        address: "Eastern Region Operations Hub, Bhubaneswar, Odisha"
    },
    'vijayawada': {
        title: "Vijayawada Branch",
        address: "Central AP Regional Center, Vijayawada, Andhra Pradesh"
    },
    'guntur': {
        title: "Guntur Branch",
        address: "PL Cross-Sell Division, Guntur, Andhra Pradesh"
    },
    'secunderabad': {
        title: "Secunderabad Branch",
        address: "Telangana Regional Hub, Secunderabad, Telangana"
    },
    'warangal': {
        title: "Warangal Branch",
        address: "North Telangana Division, Warangal, Telangana"
    },
    'karimnagar': {
        title: "Karimnagar Branch",
        address: "Karimnagar Center, Telangana"
    },
    'nellore': {
        title: "Nellore Branch",
        address: "South AP Division, Nellore, Andhra Pradesh"
    },
    'kadapa': {
        title: "Kadapa Branch",
        address: "Rayalaseema Region, Kadapa, Andhra Pradesh"
    }
};

function initMapPinHoverPopups() {
    const pins = document.querySelectorAll('.map-pin-hover');
    
    pins.forEach(pin => {
        pin.addEventListener('mouseover', (e) => {
            e.stopPropagation();
            const branchKey = pin.getAttribute('data-branch');
            const data = mapBranchAddresses[branchKey];
            if (!data) return;

            const tooltip = document.getElementById('globalLogoTooltip');
            if (!tooltip) return;

            const rect = pin.getBoundingClientRect();

            // 20% Smaller Content Typography & Spacing
            tooltip.innerHTML = `
                <div class="flex items-center gap-2 pb-2 mb-2 border-b border-white/15">
                    <i class="fa-solid fa-location-dot text-amberGold text-xs"></i>
                    <div>
                        <span class="font-heading font-bold text-xs text-white block leading-tight">${data.title}</span>
                    </div>
                </div>
                <div class="space-y-1 font-mono text-[10px]">
                    <div class="text-slate-200 font-sans text-[11px] leading-relaxed">
                        ${data.address}
                    </div>
                </div>
            `;

            // 20% Reduced Width (256px)
            const tooltipWidth = 256;

            // 1. Center Horizontally Over the Pin
            let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            leftPos = Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, leftPos));

            // 2. Position TOP Above the Pin
            let topPos = rect.top - 105;

            // Fallback: If pin is too close to top of screen, show popup below pin
            if (topPos < 10) {
                topPos = rect.bottom + 12;
            }

            tooltip.style.top = `${topPos}px`;
            tooltip.style.left = `${leftPos}px`;
            tooltip.classList.remove('hidden');
        });

        pin.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('globalLogoTooltip');
            if (tooltip) tooltip.classList.add('hidden');
        });
    });
}

window.addEventListener('DOMContentLoaded', initMapPinHoverPopups);