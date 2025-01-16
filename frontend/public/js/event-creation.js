document.addEventListener('DOMContentLoaded', function () {
    console.log("JavaScript loaded successfully!");

    const form = document.getElementById('create-event-form');
    const eventSeatsInput = document.getElementById('eventSeats');
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));

    if (form) {
        console.log("Form found!");

        // Prevent negative or zero values for event seats
        eventSeatsInput.addEventListener('input', function () {
            if (this.value < 1) {
                this.value = 1;
            }
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Show the Bootstrap modal
            successModal.show();

            // Clear the form inputs
            form.reset();

            // Redirect after the modal is closed
            document.getElementById('successModal').addEventListener('hidden.bs.modal', function () {
                window.location.href = "/event-admin-view";
            });
        });
    } else {
        console.log("Form not found!");
    }
});
