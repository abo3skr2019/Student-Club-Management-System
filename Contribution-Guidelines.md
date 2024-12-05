# Contribution Guidelines for the Open Source Application

We are excited about your interest in contributing to our web application project! To ensure smooth collaboration and maintain the project's quality, we have outlined the following guidelines for all contributors.

## 1. Repository Structure and Workflow

- **Branches**:
    - `master`: This is the main branch and the source of truth. Only stable and thoroughly reviewed code should be merged here.
        
    - `dev`: The primary development branch where all features and bug fixes are integrated before merging into `master`. Always pull the latest `dev`before creating a new branch.
        
    - `Feature Branches` : Create feature-specific branches using the naming convention: `feature/feature-name` , `bugfix/issue-description` or `docs/doc-name`.
- **Commits**:
	- Use clear, descriptive commit messages (e.g., "Fix bug in user authentication" or "Add search functionality").
		
	- Avoid large, monolithic commits; commit frequently and logically.
		- Try to make your Commits Reverable / Atomic
		
- **Pull Requests**:
	- All contributions must be submitted via pull requests (PRs).
        
	- Ensure your PR references the issue it addresses (e.g., “Closes #15”).
        
	- A minimum of two approvals from team members is required before merging a PR into dev.
        
	- Resolve all conflicts before requesting a review.
        
	- Ensure your code passes linting and all tests.

## 2. Coding Standards

- **Frontend (HTML/CSS/JavaScript):**
	- Use semantic HTML5 tags for clarity and accessibility. Avoid deprecated tags.
        
	- Ensure responsive design; use Bootstrap where applicable.
        
	- Write object-oriented JavaScript using ES6 classes.
        
	- Avoid global variables unless absolutely necessary. Use constants for configurations or class instantiations.
        
	- Classes should communicate via callbacks or custom events.

- **Backend (Node.js, Express, MongoDB):**
	- Follow RESTful conventions:
        
	- Use GET for data retrieval only.
        
	- Use POST, PUT, or DELETE for CRUD operations without query parameters.
        
	- Store persistent data in MongoDB; avoid saving data to the file system.
        
	- Ensure user authentication is implemented on every page requiring access control.
        
	- Keep routes modular and well-documented.

## 3. Documentation

- **Every contribution must include documentation updates if relevant:**
	- Update the README.md for significant changes to the app’s functionality or setup.
        
	- Include clear comments in your code to explain complex logic or architecture.
        
	- Ensure inline code comments are concise and useful.

- **Project Report Contributions:**
	- Document your features in the repository wiki, following the structure in the project guidelines.
        
	- Include flowcharts, screenshots, or examples where applicable.

## 4. Testing and Quality Assurance

- Write unit tests for all new features and bug fixes using an appropriate testing library (e.g., Jest).
    
- Ensure all tests pass before submitting a pull request.
    
- Use a linter (e.g., ESLint) to enforce coding style. The project adheres to a standard JavaScript style guide (e.g., Airbnb).

## 5. Team Collaboration

- Respect team members’ time and contributions. Keep communication clear and professional.
    
- Ensure equal contribution across the team by tracking tasks using GitHub Issues or Projects.
    
- Periodically review commit history to confirm active and balanced participation.

---
We are committed to fostering an inclusive and collaborative environment. Your contributions are valued, and we encourage you to bring your creativity and technical skills to help build something amazing!

Let’s make this project a success together 🚀
