/*
=========================================================
MENTOR APPLICATION FRONTEND
=========================================================
*/

console.log("mentor.js loaded");


/* =========================================
   GET HTML ELEMENTS
   ========================================= */

const mentorForm =
    document.getElementById("mentorForm");

const successMessage =
    document.getElementById("successMessage");

const submitBtn =
    document.getElementById("submitBtn");

const newApplicationBtn =
    document.getElementById("newApplicationBtn");

const bio =
    document.getElementById("bio");

const bioCount =
    document.getElementById("bioCount");


/* =========================================
   CHECK ELEMENTS
   ========================================= */

if (!mentorForm) {

    console.error(
        "ERROR: mentorForm was not found."
    );

}


/* =========================================
   BIO CHARACTER COUNTER
   ========================================= */

if (bio) {

    bio.addEventListener("input", () => {

        bioCount.textContent =
            bio.value.length;

    });

}


/* =========================================
   SHOW ERROR
   ========================================= */

function showError(field, message) {

    const errorElement =
        document.getElementById(
            `${field}Error`
        );

    if (errorElement) {

        errorElement.textContent =
            message;

    }

}


/* =========================================
   CLEAR ERRORS
   ========================================= */

function clearErrors() {

    document
        .querySelectorAll(".error-message")
        .forEach(error => {

            error.textContent = "";

        });

}


/* =========================================
   EMAIL VALIDATION
   ========================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================
   PHONE VALIDATION
   ========================================= */

function isValidPhone(phone) {

    return /^[0-9+\-\s()]{7,15}$/
        .test(phone);

}


/* =========================================
   VALIDATE FORM
   ========================================= */

function validateForm(data) {

    let isValid = true;

    clearErrors();


    /* FULL NAME */

    if (
        !data.fullName ||
        data.fullName.length < 2
    ) {

        showError(
            "fullName",
            "Please enter your full name."
        );

        isValid = false;

    }


    /* EMAIL */

    if (!isValidEmail(data.email)) {

        showError(
            "email",
            "Please enter a valid email address."
        );

        isValid = false;

    }


    /* PHONE */

    if (!isValidPhone(data.phone)) {

        showError(
            "phone",
            "Please enter a valid phone number."
        );

        isValid = false;

    }


    /* AREA */

    if (
        !data.areaOfInterest ||
        data.areaOfInterest.length < 2
    ) {

        showError(
            "areaOfInterest",
            "Please enter your area of interest."
        );

        isValid = false;

    }


    /* MENTORSHIP */

    if (
        !data.mentorshipFocus ||
        data.mentorshipFocus.length < 2
    ) {

        showError(
            "mentorshipFocus",
            "Please enter your mentorship focus."
        );

        isValid = false;

    }


    /* BIO */

    if (
        !data.bio ||
        data.bio.length < 30
    ) {

        showError(
            "bio",
            "Bio must contain at least 30 characters."
        );

        isValid = false;

    }


    return isValid;

}


/* =========================================
   FORM SUBMISSION
   ========================================= */

mentorForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        console.log(
            "Mentor form submitted."
        );


        /* =====================================
           COLLECT DATA
           ===================================== */

        const formData =
            new FormData(mentorForm);


        const data = {

            fullName:
                formData
                    .get("fullName")
                    .trim(),

            email:
                formData
                    .get("email")
                    .trim(),

            phone:
                formData
                    .get("phone")
                    .trim(),

            areaOfInterest:
                formData
                    .get("areaOfInterest")
                    .trim(),

            mentorshipFocus:
                formData
                    .get("mentorshipFocus")
                    .trim(),

            bio:
                formData
                    .get("bio")
                    .trim()

        };


        console.log(
            "Form data:",
            data
        );


        /* =====================================
           VALIDATION
           ===================================== */

        if (!validateForm(data)) {

            console.log(
                "Validation failed."
            );

            return;

        }


        /* =====================================
           BUTTON STATE
           ===================================== */

        submitBtn.disabled = true;

        submitBtn.textContent =
            "Submitting...";


        try {

            console.log(
                "Sending request to backend..."
            );


            /* =================================
               POST API REQUEST
               ================================= */

            const response =
                await fetch(
                    "http://localhost:5000/api/mentor/applications",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)
                    }
                );


            console.log(
                "Server response:",
                response.status
            );


            const result =
                await response.json();


            console.log(
                "Server data:",
                result
            );


            /* =================================
               API ERROR
               ================================= */

            if (!response.ok) {

                alert(
                    result.message ||
                    "Application submission failed."
                );

                return;

            }


            /* =================================
               SUCCESS
               ================================= */

            mentorForm.reset();

            bioCount.textContent = "0";

            clearErrors();

            mentorForm.classList.add(
                "hidden"
            );

            successMessage.classList.remove(
                "hidden"
            );


            console.log(
                "Application successfully submitted."
            );

        }


        catch (error) {

            console.error(
                "API CONNECTION ERROR:",
                error
            );


            alert(
                "Cannot connect to the backend. Make sure the server is running on port 5000."
            );

        }


        finally {

            submitBtn.disabled = false;

            submitBtn.textContent =
                "Submit Application";

        }

    }
);


/* =========================================
   NEW APPLICATION
   ========================================= */

newApplicationBtn.addEventListener(
    "click",
    () => {

        mentorForm.reset();

        bioCount.textContent = "0";

        clearErrors();

        successMessage.classList.add(
            "hidden"
        );

        mentorForm.classList.remove(
            "hidden"
        );

    }
);


console.log(
    "Mentor application system initialized."
);
