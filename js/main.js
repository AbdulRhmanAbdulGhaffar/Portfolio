document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'en';
    let typed;

    // --- PLEXUS BACKGROUND ANIMATION --- //
    let scene, camera, renderer, particles, lines;
    const PARTICLE_COUNT = 100;
    const MAX_DISTANCE = 120;
    let mouse = new THREE.Vector2(-1000, -1000);

    function initPlexus() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 300;
        renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('plexus-canvas'), alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const velocities = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 500;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
            velocities.push({ x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.5, z: (Math.random() - 0.5) * 0.5 });
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.userData.velocities = velocities;

        const particleMaterial = new THREE.PointsMaterial({ color: 0x0DF7F7, size: 3, sizeAttenuation: true });
        particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0DF7F7, transparent: true, opacity: 0.1 });
        lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);
        
        document.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        animatePlexus();
    }

    function animatePlexus() {
        requestAnimationFrame(animatePlexus);
        if (!particles || !lines) return; 

        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.userData.velocities;
        const linePositions = lines.geometry.attributes.position.array;
        let lineVertexIndex = 0;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            
            if (positions[i * 3] < -250 || positions[i * 3] > 250) velocities[i].x *= -1;
            if (positions[i * 3 + 1] < -250 || positions[i * 3 + 1] > 250) velocities[i].y *= -1;

            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MAX_DISTANCE) {
                    linePositions[lineVertexIndex++] = positions[i * 3];
                    linePositions[lineVertexIndex++] = positions[i * 3 + 1];
                    linePositions[lineVertexIndex++] = positions[i * 3 + 2];
                    linePositions[lineVertexIndex++] = positions[j * 3];
                    linePositions[lineVertexIndex++] = positions[j * 3 + 1];
                    linePositions[lineVertexIndex++] = positions[j * 3 + 2];
                }
            }
        }
        
        lines.geometry.attributes.position.needsUpdate = true;
        lines.geometry.setDrawRange(0, lineVertexIndex / 3);
        particles.geometry.attributes.position.needsUpdate = true;

        if (camera && scene) {
            camera.position.x += (mouse.x * 50 - camera.position.x) * 0.05;
            camera.position.y += (mouse.y * 50 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
            renderer.render(scene, camera);
        }
    }


    // --- CONTENT RENDERING --- //
    const renderContent = () => {
        const langData = portfolioData[currentLang];
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        document.body.classList.toggle('font-cairo', currentLang === 'ar');
        
        document.querySelectorAll('[data-lang-key]').forEach(el => { 
            const key = el.getAttribute('data-lang-key'); 
            if (langData.text[key]) {
                const content = langData.text[key];
                if (typeof content === 'string') {
                    el.textContent = content;
                    if (el.classList.contains('glitch')) {
                        el.dataset.text = content;
                    }
                }
            }
        });
        document.querySelectorAll('[data-lang-placeholder]').forEach(el => { const key = el.getAttribute('data-lang-placeholder'); if (langData.text[key]) el.placeholder = langData.text[key]; });
        
        document.getElementById('hero-objective').textContent = langData.objective;
        document.querySelector('[data-lang-key="about_desc"]').textContent = langData.about;
        
        if (typed) typed.destroy();
        typed = new Typed('#typed-role', { strings: langData.text.hero_role, typeSpeed: 70, backSpeed: 50, loop: true, backDelay: 2000 });
        
        const statsList = document.getElementById('stats-list');
        statsList.innerHTML = '';
        langData.stats.forEach(stat => { statsList.innerHTML += `<div class="glass-card p-4 tilt-effect"><p class="text-4xl font-bold text-primary-color mb-2">${stat.value}</p><p class="text-gray-400">${stat.label_en}</p></div>`; });
        
        const expertiseList = document.getElementById('expertise-list');
        expertiseList.innerHTML = '';
        langData.expertise.forEach((item, index) => { 
            expertiseList.innerHTML += `
            <div class="glass-card p-6 text-center tilt-effect fade-in-up" style="animation-delay: ${index * 0.2}s">
                <i class="${item.icon} text-4xl text-primary-color mb-4"></i>
                <h3 class="text-xl font-bold text-white mb-2">${item.title}</h3>
                <p class="text-gray-400">${item.description}</p>
            </div>`; 
        });
        
        const experienceList = document.getElementById('experience-list');
        experienceList.innerHTML = '';
        langData.experience.forEach(item => { experienceList.innerHTML += `<div class="timeline-item"><div class="timeline-icon"><i class="fas fa-briefcase text-xs"></i></div><h3 class="font-bold text-xl text-white">${item.title}</h3><p class="text-primary-color font-semibold mb-1">${item.company} | ${item.date}</p><ul class="list-disc list-inside text-gray-400 space-y-2">${item.duties.map(duty => `<li>${duty}</li>`).join('')}</ul></div>`; });
        
        const skillsList = document.getElementById('skills-list');
        skillsList.innerHTML = `<div class="flex flex-wrap justify-center gap-4">${langData.skills.map(skill => `<span class="bg-secondary-color text-primary-color text-md font-semibold px-5 py-2 rounded-md">${skill}</span>`).join('')}</div>`;
        
        const certList = document.getElementById('certifications-list');
        certList.innerHTML = '';
        langData.certifications.forEach(cert => { 
            const noFilterClass = cert.noFilter ? 'no-filter' : '';
            certList.innerHTML += `
                <div class="glass-card tilt-effect cert-card">
                    <div class="cert-logo-container">
                        <img src="${cert.logo}" alt="${cert.issuer} Logo" class="cert-logo ${noFilterClass}" onerror="this.parentElement.innerHTML = '<i class="fas fa-certificate text-3xl text-primary-color"></i>'; this.remove();">
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-white">${cert.name}</h3>
                        <p class="text-gray-400 text-sm">${cert.issuer}</p>
                        <p class="text-primary-color/80 text-xs mt-1"><em>Training: ${cert.training}</em></p>
                    </div>
                </div>`; 
        });

        const projectsGrid = document.getElementById('projects-grid');
        const projectFilters = document.getElementById('project-filters');
        projectsGrid.innerHTML = '';
        const allTags = [...new Set(langData.projects.flatMap(p => p.tags))];
        
        projectFilters.innerHTML = `<button class="filter-btn active bg-primary-color text-black px-4 py-2 rounded-md" data-filter="all">${langData.text.project_filter_all || 'All'}</button>`;
        allTags.forEach(tag => { projectFilters.innerHTML += `<button class="filter-btn bg-secondary-color text-gray-300 px-4 py-2 rounded-md" data-filter="${tag}">${tag}</button>`; });

        langData.projects.forEach(project => {
            projectsGrid.innerHTML += `<div class="glass-card overflow-hidden tilt-effect" data-tags="${project.tags.join(',')}"><img src="${project.image}" alt="${project.title}" class="w-full h-56 object-cover"><div class="p-6"><h3 class="text-xl font-bold text-white mb-2">${project.title}</h3><div class="flex flex-wrap gap-2 mb-4">${project.tags.map(tag => `<span class="bg-secondary-color text-primary-color text-xs font-semibold px-2 py-1 rounded-md">${tag}</span>`).join('')}</div><p class="text-gray-400 mb-4">${project.description}</p><a href="${project.link}" target="_blank" class="text-primary-color font-semibold hover:underline">${langData.text.project_link_text || 'Access Project'} <i class="fas fa-arrow-right ml-1"></i></a></div></div>`;
        });
        addFilterListeners();
        addTiltEffect();

        const { linkedin, github, medium, email } = portfolioData.contact;
        document.getElementById('articles-linkedin').href = linkedin;
        document.getElementById('articles-github').href = github;
        document.getElementById('articles-medium').href = medium;
        document.getElementById('contact-linkedin-footer').href = linkedin;
        document.getElementById('contact-github-footer').href = github;
        document.getElementById('contact-medium-footer').href = medium;
        document.getElementById('contact-email-link').href = `mailto:${email}`;
        document.getElementById('footer-year').textContent = new Date().getFullYear();
    };


    // --- UI EFFECTS & INTERACTIONS --- //
    const scrambleText = (element) => {
        const originalText = element.dataset.originalText;
        if (!originalText) return;
        const chars = '!<>-_\\/[]{}—=+*^?#________';
        let frame = 0; const frameRate = 3; const endFrame = originalText.length * frameRate;
        const interval = setInterval(() => {
            element.textContent = Array.from(originalText, (char, i) => {
                const progress = Math.floor(frame / frameRate);
                return i < progress ? originalText[i] : chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            if (frame >= endFrame) { clearInterval(interval); element.textContent = originalText; }
            frame++;
        }, 30);
    };

    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');

    const typeToTerminal = (text, callback) => {
        let i = 0; const p = document.createElement('p'); terminalOutput.appendChild(p);
        const typing = setInterval(() => {
            p.textContent += text[i]; i++;
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            if (i === text.length) { clearInterval(typing); if (callback) callback(); }
        }, 20);
    };

    const executeCommand = (cmd) => {
        const p = document.createElement('p'); p.innerHTML = `<span class="text-primary-color">user@AAG.dev:~$</span> ${cmd}`; terminalOutput.appendChild(p);
        const commands = {
            'help': () => typeToTerminal("Available commands: 'about', 'expertise', 'projects', 'contact', 'clear'"),
            'about': () => { document.getElementById('about').scrollIntoView(); typeToTerminal("Navigating to 'About Me' section..."); },
            'expertise': () => { document.getElementById('expertise').scrollIntoView(); typeToTerminal("Navigating to 'Areas of Expertise'..."); },
            'projects': () => { document.getElementById('projects').scrollIntoView(); typeToTerminal("Loading project archives..."); },
            'contact': () => { document.getElementById('contact').scrollIntoView(); typeToTerminal("Initializing contact sequence..."); },
            'clear': () => { terminalOutput.innerHTML = ''; },
            'sudo': () => typeToTerminal("Access denied. Nice try, though.")
        };
        commands[cmd] ? commands[cmd]() : typeToTerminal(`Command not found: ${cmd}. Type 'help' for available commands.`);
        terminalInput.value = ''; terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };
    
    terminalInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const command = e.target.value.trim().toLowerCase(); if(command) executeCommand(command); }});

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                const title = entry.target.querySelector('.section-title');
                if(title && !title.dataset.scrambled) {
                    title.dataset.originalText = title.textContent; scrambleText(title); title.dataset.scrambled = "true";
                }
            }
        });
    }, { threshold: 0.2 });

    const addFilterListeners = () => {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('#projects-grid > div');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => {btn.classList.remove('active', 'bg-primary-color', 'text-black'); btn.classList.add('bg-secondary-color', 'text-gray-300')});
                button.classList.add('active', 'bg-primary-color', 'text-black'); button.classList.remove('bg-secondary-color', 'text-gray-300');
                const filter = button.dataset.filter;
                projectCards.forEach(card => { 
                    const cardTags = card.dataset.tags;
                    card.style.display = (filter === 'all' || (cardTags && cardTags.includes(filter))) ? 'block' : 'none';
                });
            });
        });
    };
    
    function addTiltEffect() {
        document.querySelectorAll(".tilt-effect").forEach(el => {
            el.addEventListener("mousemove", (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * 5;
                const rotateY = -((x - rect.width / 2) / (rect.width / 2)) * 5;
                el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
            el.addEventListener("mouseleave", () => {
                el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }


    // --- EVENT LISTENERS --- //
    document.getElementById('mobile-menu-btn').addEventListener('click', () => document.getElementById('mobile-menu').classList.toggle('hidden'));
    document.querySelectorAll('.mobile-link').forEach(link => link.addEventListener('click', () => document.getElementById('mobile-menu').classList.add('hidden')));
    window.addEventListener('scroll', () => { 
        document.getElementById('header').classList.toggle('backdrop-blur-lg', window.scrollY > 50);
        document.getElementById('to-top-btn').classList.toggle('show', window.scrollY > 300) 
    });
    document.getElementById('to-top-btn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.getElementById('contact-form').addEventListener('submit', (e) => { 
        e.preventDefault(); 
        const successMsg = document.getElementById('form-success-message'); 
        successMsg.textContent = portfolioData[currentLang].text.contact_form_success; 
        successMsg.classList.remove('hidden'); 
        e.target.reset(); 
        setTimeout(() => successMsg.classList.add('hidden'), 5000); 
    });


    // --- INITIALIZATION --- //
    const preloader = document.getElementById('preloader');
    const preloaderText = document.getElementById('preloader-text');
    const bootSequence = [ "INITIALIZING KERNEL...", "LOADING SYSTEM MODULES...", "DECRYPTING FILESYSTEM...", "ESTABLISHING SECURE CONNECTION...", "ACCESS GRANTED." ];
    let seqIndex = 0;
    const interval = setInterval(() => {
        if(seqIndex < bootSequence.length) {
            preloaderText.innerHTML += `<div>${bootSequence[seqIndex]}</div>`;
            seqIndex++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                preloader.style.opacity = '0';
                preloader.style.pointerEvents = 'none';
                document.body.classList.add('loaded');
                renderContent();
                document.querySelectorAll('.fade-in-up').forEach(section => observer.observe(section));
                typeToTerminal("Welcome to AbdulRhman's Portfolio Terminal.", () => typeToTerminal("Type 'help' to see available commands."));
                initPlexus();
            }, 500);
        }
    }, 400);

});