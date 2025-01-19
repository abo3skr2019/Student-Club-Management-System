// This script can handle any interactivity needed for the dashboard

console.log("Club Admin Dashboard loaded!");

// Example: Navigation active link update
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});
