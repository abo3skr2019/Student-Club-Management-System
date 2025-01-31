function toggleEdit() {
    const form = document.getElementById('edit-club-form');
    // Select all elements with IDs ending in "-display" or "-edit"
    const displayElements = form.querySelectorAll('[id$="-display"]');
    const editElements = form.querySelectorAll('[id$="-edit"]');  
    const editButtons = document.getElementById('edit-buttons');
    
    // Toggle visibility of display and edit elements
    displayElements.forEach(el => el.classList.toggle('d-none'));
    editElements.forEach(el => el.classList.toggle('d-none'));

    editButtons.classList.toggle('d-none');
}