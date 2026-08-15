/*
CONTACT MODULE
*/

const contactForm = getElement("contact-form");
const contactSubmitButton = getElement("contact-submit-button");
const contactSubmitText = getElement("contact-submit-text");
const contactMessageBox = getElement("contact-form-message");

const contactFields = {
    name: getElement("contact-name"),
    email: getElement("contact-email-input"),
    phone: getElement("contact-phone-input"),
    subject: getElement("contact-subject"),
    message: getElement("contact-message")
};

let contactMessageTimeout;


/*
CONTACT INFO
*/

async function loadContactInfo() {
    try {
        const contact = await getContactInfo();

        if (!contact) return;

        setElementText(
            "contact-address",
            contact.address
        );

        setElementText(
            "contact-phone",
            contact.phone
        );

        setElementText(
            "contact-email",
            contact.email
        );

        setElementText(
            "contact-opening-hours",
            contact.opening_hours
        );

        setElementLink(
            "contact-phone-link",
            contact.phone
                ? `tel:${normalizePhoneForLink(contact.phone)}`
                : "#"
        );

        setElementLink(
            "contact-email-link",
            contact.email
                ? `mailto:${contact.email}`
                : "#"
        );

    } catch (error) {
        console.error(
            "Contact info loading failed:",
            error
        );
    }
}


/*
INLINE MESSAGE
*/

function showContactMessage(
    message,
    success = true
) {
    if (!contactMessageBox) return;

    clearTimeout(contactMessageTimeout);

    contactMessageBox.classList.remove(
        "hidden",
        "border-green-500",
        "border-red-500",
        "text-green-400",
        "text-red-400"
    );

    contactMessageBox.classList.add(
        success
            ? "border-green-500"
            : "border-red-500",
        success
            ? "text-green-400"
            : "text-red-400"
    );

    contactMessageBox.textContent =
        message;

    contactMessageTimeout =
        setTimeout(() => {
            contactMessageBox.classList.add(
                "hidden"
            );
        }, 5000);
}


/*
SUBMIT STATE
*/

function setContactLoading(loading) {
    if (!contactSubmitButton) return;

    contactSubmitButton.disabled =
        loading;

    if (!contactSubmitText) return;

    contactSubmitText.innerHTML =
        loading
            ? `
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                Sending...
            `
            : `
                <i class="fa-solid fa-paper-plane mr-2"></i>
                Send Message
            `;
}


/*
FORM DATA
*/

function getContactFormData() {
    return {
        name:
            contactFields.name?.value.trim() || "",

        email:
            contactFields.email?.value.trim() || "",

        phone:
            contactFields.phone?.value.trim() || "",

        subject:
            contactFields.subject?.value.trim() || "",

        message:
            contactFields.message?.value.trim() || ""
    };
}


/*
SUBMIT CONTACT FORM
*/

async function handleContactSubmit(event) {
    event.preventDefault();

    if (!contactForm) return;

    const data =
        getContactFormData();

    contactMessageBox
        ?.classList
        .add("hidden");

    setContactLoading(true);

    try {
        await sendContactMessage(data);

        showContactMessage(
            "Message sent successfully."
        );

        showSuccess(
            "Message sent successfully."
        );

        contactForm.reset();

    } catch (error) {
        console.error(
            "Contact message failed:",
            error
        );

        const message =
            error.message ||
            "Failed to send message.";

        showContactMessage(
            message,
            false
        );

        showError(message);

    } finally {
        setContactLoading(false);
    }
}


/*
EVENTS
*/

contactForm?.addEventListener(
    "submit",
    handleContactSubmit
);

document.addEventListener(
    "DOMContentLoaded",
    loadContactInfo
);