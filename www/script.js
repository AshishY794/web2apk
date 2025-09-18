// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('TestApp loaded successfully!');
    
    // Initialize all features
    initNavigation();
    initScrollEffects();
    initAnimations();
    initFormHandling();
    initThemeChanger();
    
    // Add loading animation
    document.body.classList.add('fade-in-up');
});

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
    });
}

// Scroll effects
function initScrollEffects() {
    const backToTopBtn = document.querySelector('.back-to-top');
    
    // Show/hide back to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    // Back to top functionality
    backToTopBtn.addEventListener('click', scrollToTop);
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Animations on scroll
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Observe about section
    const aboutSection = document.querySelector('.about');
    if (aboutSection) {
        aboutSection.style.opacity = '0';
        aboutSection.style.transform = 'translateY(30px)';
        aboutSection.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(aboutSection);
    }
}

// Form handling
function initFormHandling() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleSubmit);
    }
}

// Handle form submission
function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Simple validation
    if (!name || !email || !message) {
        showNotification('Please fill in all fields!', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address!', 'error');
        return;
    }
    
    // Simulate form submission
    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
    
    // Reset form
    event.target.reset();
    
    // In a real app, you would send the data to a server here
    console.log('Form submitted:', { name, email, message });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Theme changer functionality
function initThemeChanger() {
    // Store theme preference
    const savedTheme = localStorage.getItem('theme') || 'default';
    applyTheme(savedTheme);
}

// Apply theme
function applyTheme(theme) {
    const root = document.documentElement;
    
    switch(theme) {
        case 'dark':
            root.style.setProperty('--bg-color', '#1a1a1a');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--text-light', '#cccccc');
            root.style.setProperty('--card-bg', '#2d2d2d');
            root.style.setProperty('--border-color', '#404040');
            break;
        case 'purple':
            root.style.setProperty('--primary-color', '#9c27b0');
            root.style.setProperty('--secondary-color', '#673ab7');
            break;
        case 'green':
            root.style.setProperty('--primary-color', '#4caf50');
            root.style.setProperty('--secondary-color', '#2e7d32');
            break;
        case 'orange':
            root.style.setProperty('--primary-color', '#ff9800');
            root.style.setProperty('--secondary-color', '#f57c00');
            break;
        default:
            // Reset to default theme
            root.style.setProperty('--bg-color', '#ffffff');
            root.style.setProperty('--text-color', '#333');
            root.style.setProperty('--text-light', '#666');
            root.style.setProperty('--card-bg', '#f8f9fa');
            root.style.setProperty('--border-color', '#e9ecef');
            root.style.setProperty('--primary-color', '#667eea');
            root.style.setProperty('--secondary-color', '#764ba2');
    }
    
    localStorage.setItem('theme', theme);
}

// Global functions for HTML onclick events
function showAlert() {
    const messages = [
        "Welcome to TestApp! 🚀",
        "This is a test website for Web2App conversion! 📱",
        "Your web app is ready to become an Android APK! 🎉",
        "Amazing! This will work perfectly on mobile! ✨",
        "Ready to convert to APK? Let's go! 🚀"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage, 'success');
}

function changeTheme() {
    const themes = ['default', 'dark', 'purple', 'green', 'orange'];
    const currentTheme = localStorage.getItem('theme') || 'default';
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    applyTheme(nextTheme);
    
    const themeNames = {
        'default': 'Default',
        'dark': 'Dark',
        'purple': 'Purple',
        'green': 'Green',
        'orange': 'Orange'
    };
    
    showNotification(`Theme changed to ${themeNames[nextTheme]}!`, 'info');
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Performance monitoring
window.addEventListener('load', function() {
    console.log('TestApp fully loaded!');
    console.log('Performance metrics:');
    console.log('- DOM Content Loaded:', performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart, 'ms');
    console.log('- Page Load Complete:', performance.timing.loadEventEnd - performance.timing.navigationStart, 'ms');
});

// Add touch support for mobile
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // Add touch feedback for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // In a real app, you would register a service worker here
        console.log('Service Worker support detected - ready for PWA features!');
    });
}

// Export functions for global access
window.showAlert = showAlert;
window.changeTheme = changeTheme;
window.scrollToTop = scrollToTop;
window.handleSubmit = handleSubmit;

