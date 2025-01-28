// JavaScript file for club dashboard functionality

document.addEventListener("DOMContentLoaded", () => {
    console.log("Club dashboard script loaded");

    // Function to save club info
    function saveClubInfo() {
        // Get data from fields
        const clubName = document.getElementById('clubName').value;
        const clubDescription = document.getElementById('clubDescription').value;
        const clubSupervisor = document.getElementById('clubSupervisor').value;

        // Log the data (this is where you would send it to the server via an API)
        console.log({
            clubName,
            clubDescription,
            clubSupervisor
        });

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editClubModal'));
        modal.hide();
    }

    // Attach saveClubInfo to the save button
    const saveButton = document.querySelector("button[onclick='saveClubInfo()']");
    if (saveButton) {
        saveButton.addEventListener("click", saveClubInfo);
    }
});