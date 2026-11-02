document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fade-in on scroll
const revealTargets = document.querySelectorAll(
    '.card, .reason, .stat, .comparison-col, .gallery-item, .accordion-item'
);

revealTargets.forEach(function (el) {
    el.classList.add('reveal');
});

if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealTargets.forEach(function (el) {
        revealObserver.observe(el);
    });
} else {
    revealTargets.forEach(function (el) {
        el.classList.add('visible');
    });
}

// Animated number counters (home page)
const counters = document.querySelectorAll('[data-count]');

if (counters.length && !reduceMotion) {
    function runCounter(el) {
        const end = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const duration = 1400;

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(end * progress) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    const counterObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                runCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(function (c) {
        counterObserver.observe(c);
    });
}
// FAQ accordion
const accordionButtons = document.querySelectorAll('.accordion-btn');

accordionButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        const panel = document.getElementById(button.getAttribute('aria-controls'));

        if (isOpen) {
            button.setAttribute('aria-expanded', 'false');
            panel.style.maxHeight = null;
        } else {
            button.setAttribute('aria-expanded', 'true');
            panel.style.maxHeight = panel.scrollHeight + 'px';
        }
    });
});
// Gallery lightbox
const lightbox = document.getElementById('lightbox');

if (lightbox) {
    const images = document.querySelectorAll('.gallery-item img');
    const lbImg = document.getElementById('lb-img');
    let current = 0;

    function showImage(index) {
        current = (index + images.length) % images.length;
        lbImg.src = images[current].src;
        lbImg.alt = images[current].alt;
    }

    function openLightbox(index) {
        showImage(index);
        lightbox.hidden = false;
    }

    function closeLightbox() {
        lightbox.hidden = true;
    }

    images.forEach(function (img, index) {
        img.addEventListener('click', function () {
            openLightbox(index);
        });
    });

    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', function () { showImage(current - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { showImage(current + 1); });

    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showImage(current - 1);
        if (e.key === 'ArrowRight') showImage(current + 1);
    });
}
// Booking form validation
const bookingForm = document.getElementById('booking-form');

if (bookingForm) {
    const status = document.getElementById('form-status');

    // Stop people choosing a date in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('calendar').min = yyyy + '-' + mm + '-' + dd;

    // One rule per field: returns an error message, or '' if the value is fine
    const rules = {
        name: function (v) {
            if (!v) return 'Please enter your name.';
            if (v.length < 2) return 'Name is too short.';
            return '';
        },
        email: function (v) {
            if (!v) return 'Please enter your email.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email like name@example.com.';
            return '';
        },
        phone: function (v) {
            const digits = v.replace(/[\s-]/g, '');
            if (!v) return 'Please enter your phone number.';
            if (!/^(\+27|0)[1-9]\d{8}$/.test(digits)) return 'Enter a valid SA number, e.g. 082 123 4567.';
            return '';
        },
        service: function (v) {
            return v ? '' : 'Please choose a service.';
        },
        calendar: function (v) {
            if (!v) return 'Please pick a date.';
            const chosen = new Date(v + 'T00:00:00');
            if (chosen < today) return 'The date cannot be in the past.';
            if (chosen.getDay() === 0) return 'We work Monday to Saturday. Please pick another day.';
            return '';
        },
        message: function (v) {
            if (!v) return 'Please add your address and vehicle details.';
            if (v.length < 10) return 'Please write at least 10 characters.';
            return '';
        }
    };

    function checkField(id) {
        const field = document.getElementById(id);
        const message = rules[id](field.value.trim());
        document.getElementById(id + '-error').textContent = message;
        field.classList.toggle('invalid', message !== '');
        return message === '';
    }

    // Check each field when the user leaves it
    Object.keys(rules).forEach(function (id) {
        document.getElementById(id).addEventListener('blur', function () {
            checkField(id);
        });
    });

    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();
        status.className = 'form-status';
        status.textContent = '';

        const results = Object.keys(rules).map(checkField);

        if (results.includes(false)) {
            status.classList.add('bad');
            status.textContent = 'Please fix the highlighted fields and try again.';
            return;
        }

        status.classList.add('good');
        status.textContent = 'Thank you, ' + document.getElementById('name').value.trim() +
            '! Your booking request was received. We will contact you shortly.';
        bookingForm.reset();
    });
}
// Leaflet map (contact page)
const mapBox = document.getElementById('map');

if (mapBox && typeof L !== 'undefined') {
    const dundee = [-28.1667, 30.2333];

    const map = L.map('map').setView(dundee, 10);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker(dundee)
        .addTo(map)
        .bindPopup('<strong>Premium Mobile Carwash</strong><br>Dundee, KwaZulu-Natal');

    // Circle showing roughly where you travel (30 km)
    L.circle(dundee, {
        radius: 30000,
        color: '#0783c6',
        fillOpacity: 0.08
    }).addTo(map);
}
// Dynamic services list with search, sort and filter
const serviceList = document.getElementById('service-list');

if (serviceList) {
    const services = [
        { name: 'Interior Cleaning', price: 100, time: '~30 min', type: 'Service', icon: '🧹', text: 'Vacuum, dashboard wipe-down, door panels, mats and window interiors.' },
        { name: 'Exterior Washing', price: 100, time: '~30 min', type: 'Service', icon: '🚿', text: 'Hand wash, pre-rinse, wheels and tyres, finished with a streak-free dry.' },
        { name: 'Full Detailing', price: 220, time: '~60 min', type: 'Service', icon: '🚗', text: 'Interior and exterior combined, plus a wax finish and tyre shine.' },
        { name: 'Engine Bay Wash', price: 280, time: '~45 min', type: 'Service', icon: '🔧', text: 'Careful degreasing and rinse of the engine bay, done safely around electronics.' },
        { name: 'Undercarriage Wash', price: 200, time: 'Add-on', type: 'Add-on', icon: '🛞', text: 'Cleans and protects the undercarriage of the car.' },
        { name: 'Wax On / Off', price: 80, time: 'Add-on', type: 'Add-on', icon: '🪄', text: 'Removes light scratches and stains, restoring shine.' },
        { name: 'Headlight Polish', price: 80, time: 'Add-on', type: 'Add-on', icon: '💡', text: 'Restores clarity to faded or yellowed headlight covers.' }
    ];

    const searchBox = document.getElementById('service-search');
    const sortBox = document.getElementById('service-sort');
    const filterBox = document.getElementById('service-filter');
    const countText = document.getElementById('service-count');

    function renderServices() {
        const query = searchBox.value.trim().toLowerCase();

        // 1. Filter by type and by search text
        let results = services.filter(function (s) {
            const matchesType = filterBox.value === 'all' || s.type === filterBox.value;
            const matchesText = (s.name + ' ' + s.text).toLowerCase().includes(query);
            return matchesType && matchesText;
        });

        // 2. Sort
        if (sortBox.value === 'price-asc') results.sort(function (a, b) { return a.price - b.price; });
        if (sortBox.value === 'price-desc') results.sort(function (a, b) { return b.price - a.price; });
        if (sortBox.value === 'name') results.sort(function (a, b) { return a.name.localeCompare(b.name); });

        // 3. Build the cards
        serviceList.textContent = '';

        results.forEach(function (s) {
            const card = document.createElement('div');
            card.className = 'card visible';

            const icon = document.createElement('div');
            icon.className = 'card-icon';
            icon.textContent = s.icon;

            const title = document.createElement('h3');
            title.textContent = s.name;

            const price = document.createElement('div');
            price.className = 'card-price';
            price.textContent = (s.type === 'Add-on' ? '+ R' : 'R') + s.price + ' ';

            const time = document.createElement('span');
            time.textContent = '· ' + s.time;
            price.appendChild(time);

            const desc = document.createElement('p');
            desc.textContent = s.text;

            card.append(icon, title, price, desc);
            serviceList.appendChild(card);
        });

        countText.textContent = results.length
            ? 'Showing ' + results.length + ' of ' + services.length + ' services'
            : 'No services match your search.';
    }

    searchBox.addEventListener('input', renderServices);
    sortBox.addEventListener('change', renderServices);
    filterBox.addEventListener('change', renderServices);

    renderServices();
}