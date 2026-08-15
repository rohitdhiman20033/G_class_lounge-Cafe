const PROFILE_STORAGE_KEYS = {
    accessToken: "accessToken",
    refreshToken: "refreshToken",
    currentUser: "currentUser"
};


let selectedProfileImage = null;
let loadedProfileUser = null;


// ========================================
// SESSION
// ========================================

function redirectToProfileLogin() {
    window.location.href =
        "login.html?next=profile.html";
}


function clearProfileSession() {
    localStorage.removeItem(
        PROFILE_STORAGE_KEYS.accessToken
    );

    localStorage.removeItem(
        PROFILE_STORAGE_KEYS.refreshToken
    );

    localStorage.removeItem(
        PROFILE_STORAGE_KEYS.currentUser
    );
}


function profileLogout() {
    clearProfileSession();
    window.location.href = "index.html";
}


// ========================================
// ELEMENT HELPERS
// ========================================

function getProfileElement(id) {
    return document.getElementById(id);
}


function setInputValue(id, value) {
    const input = getProfileElement(id);

    if (input) {
        input.value = value ?? "";
    }
}


// ========================================
// MESSAGE
// ========================================

function showProfileMessage(
    message,
    type = "error"
) {
    const messageBox =
        getProfileElement("profile-message");

    if (!messageBox) return;

    messageBox.textContent = message;

    messageBox.classList.remove(
        "hidden",
        "border-red-500/40",
        "bg-red-500/10",
        "text-red-300",
        "border-green-500/40",
        "bg-green-500/10",
        "text-green-300",
        "border-yellow-500/40",
        "bg-yellow-500/10",
        "text-yellow-300"
    );

    if (type === "success") {
        messageBox.classList.add(
            "border-green-500/40",
            "bg-green-500/10",
            "text-green-300"
        );
    } else if (type === "warning") {
        messageBox.classList.add(
            "border-yellow-500/40",
            "bg-yellow-500/10",
            "text-yellow-300"
        );
    } else {
        messageBox.classList.add(
            "border-red-500/40",
            "bg-red-500/10",
            "text-red-300"
        );
    }

    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


function hideProfileMessage() {
    getProfileElement("profile-message")
        ?.classList.add("hidden");
}


// ========================================
// LOADING
// ========================================

function setProfilePageLoading(isLoading) {
    const loading =
        getProfileElement("profile-loading");

    const content =
        getProfileElement("profile-content");

    if (isLoading) {
        loading?.classList.remove("hidden");
        content?.classList.add("hidden");
    } else {
        loading?.classList.add("hidden");
        content?.classList.remove("hidden");
    }
}


function setProfileSaveLoading(isLoading) {
    const button =
        getProfileElement("profile-save-button");

    const buttonText =
        getProfileElement("profile-save-button-text");

    if (!button || !buttonText) return;

    button.disabled = isLoading;

    if (isLoading) {
        buttonText.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Saving...
        `;
    } else {
        buttonText.innerHTML = `
            <i class="fa-solid fa-floppy-disk mr-2"></i>
            Save Changes
        `;
    }
}


// ========================================
// PROFILE IMAGE
// ========================================

function displayProfileImage(imageUrl) {
    const image =
        getProfileElement("profile-image-preview");

    const placeholder =
        getProfileElement("profile-image-placeholder");

    if (!image || !placeholder) return;

    if (imageUrl) {
        image.src = imageUrl;
        image.classList.remove("hidden");
        placeholder.classList.add("hidden");
    } else {
        image.removeAttribute("src");
        image.classList.add("hidden");
        placeholder.classList.remove("hidden");
    }
}


function validateSelectedProfileImage(file) {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        throw new Error(
            "Only JPG, PNG and WEBP images are allowed."
        );
    }

    if (file.size > maxSize) {
        throw new Error(
            "Profile image must be smaller than 5 MB."
        );
    }
}


function handleProfileImageSelection(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
        validateSelectedProfileImage(file);

        selectedProfileImage = file;

        const previewUrl =
            URL.createObjectURL(file);

        displayProfileImage(previewUrl);

        showProfileMessage(
            "New profile image selected. Save changes to upload it.",
            "warning"
        );

    } catch (error) {
        event.target.value = "";
        selectedProfileImage = null;

        showProfileMessage(
            error.message ||
            "Invalid profile image."
        );
    }
}


// ========================================
// BIO COUNT
// ========================================

function updateBioCharacterCount() {
    const bioInput =
        getProfileElement("profile-bio");

    const counter =
        getProfileElement("bio-character-count");

    if (!bioInput || !counter) return;

    counter.textContent =
        `${bioInput.value.length} / 300`;
}


// ========================================
// RENDER USER
// ========================================

function renderProfileUser(user) {
    loadedProfileUser = user;

    setInputValue(
        "profile-full-name",
        user.full_name
    );

    setInputValue(
        "profile-email",
        user.email
    );

    setInputValue(
        "profile-phone",
        user.phone
    );

    setInputValue(
        "profile-bio",
        user.bio
    );

    setInputValue(
        "profile-date-of-birth",
        user.date_of_birth
    );

    setInputValue(
        "profile-gender",
        user.gender
    );

    setInputValue(
        "profile-city",
        user.city
    );

    setInputValue(
        "profile-state",
        user.state
    );

    setInputValue(
        "profile-country",
        user.country
    );

    setInputValue(
        "profile-postal-code",
        user.postal_code
    );

    const displayName =
        getProfileElement("profile-display-name");

    const displayEmail =
        getProfileElement("profile-display-email");

    const roleBadge =
        getProfileElement("profile-role-badge");

    const verificationBadge =
        getProfileElement(
            "profile-verification-badge"
        );

    if (displayName) {
        displayName.textContent =
            user.full_name ||
            user.username ||
            "User";
    }

    if (displayEmail) {
        displayEmail.textContent =
            user.email || "";
    }

    if (roleBadge) {
        const role =
            user.role || "customer";

        roleBadge.textContent =
            role.charAt(0).toUpperCase() +
            role.slice(1);
    }

    if (verificationBadge) {
        if (user.is_verified) {
            verificationBadge.textContent =
                "Verified";

            verificationBadge.className =
                "px-4 py-2 rounded-full " +
                "bg-green-500/10 " +
                "border border-green-500/30 " +
                "text-green-300 text-xs";
        } else {
            verificationBadge.textContent =
                "Not Verified";

            verificationBadge.className =
                "px-4 py-2 rounded-full " +
                "bg-gray-500/10 " +
                "border border-gray-500/30 " +
                "text-gray-400 text-xs";
        }
    }

    displayProfileImage(
        user.profile_image
    );

    updateBioCharacterCount();
}



// LOAD PROFILE


async function loadProfile() {
    const accessToken =
        localStorage.getItem(
            PROFILE_STORAGE_KEYS.accessToken
        );

    if (!accessToken) {
        redirectToProfileLogin();
        return;
    }

    setProfilePageLoading(true);
    hideProfileMessage();

    try {
        const user =
            await getCurrentUser();

        renderProfileUser(user);

        localStorage.setItem(
            PROFILE_STORAGE_KEYS.currentUser,
            JSON.stringify(user)
        );

    } catch (error) {
        console.error(
            "Profile loading error:",
            error
        );

        if (
            error.status === 401 ||
            error.message
                ?.toLowerCase()
                .includes("session expired")
        ) {
            clearProfileSession();
            redirectToProfileLogin();
            return;
        }

        showProfileMessage(
            error.message ||
            "Unable to load profile."
        );

    } finally {
        setProfilePageLoading(false);
    }
}



// VALIDATION


function validateProfileForm() {
    const fullName =
        getProfileElement(
            "profile-full-name"
        ).value.trim();

    const phone =
        getProfileElement(
            "profile-phone"
        ).value.trim();

    const bio =
        getProfileElement(
            "profile-bio"
        ).value.trim();

    if (fullName.length < 2) {
        throw new Error(
            "Please enter a valid full name."
        );
    }

    if (
        phone &&
        !/^\d{10}$/.test(phone)
    ) {
        throw new Error(
            "Enter a valid 10-digit phone number."
        );
    }

    if (bio.length > 300) {
        throw new Error(
            "Bio cannot exceed 300 characters."
        );
    }
}


// ========================================
// FORM DATA
// ========================================

function appendOptionalFormValue(
    formData,
    key,
    value
) {
    const cleanValue =
        typeof value === "string"
            ? value.trim()
            : value;

    if (
        cleanValue !== null &&
        cleanValue !== undefined
    ) {
        formData.append(
            key,
            cleanValue
        );
    }
}


function buildProfileFormData() {
    const formData =
        new FormData();

    appendOptionalFormValue(
        formData,
        "full_name",
        getProfileElement(
            "profile-full-name"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "phone",
        getProfileElement(
            "profile-phone"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "bio",
        getProfileElement(
            "profile-bio"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "date_of_birth",
        getProfileElement(
            "profile-date-of-birth"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "gender",
        getProfileElement(
            "profile-gender"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "city",
        getProfileElement(
            "profile-city"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "state",
        getProfileElement(
            "profile-state"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "country",
        getProfileElement(
            "profile-country"
        ).value
    );

    appendOptionalFormValue(
        formData,
        "postal_code",
        getProfileElement(
            "profile-postal-code"
        ).value
    );

    if (selectedProfileImage) {
        formData.append(
            "profile_image",
            selectedProfileImage
        );
    }

    return formData;
}


// ========================================
// UPDATE PROFILE
// ========================================

async function handleProfileSubmit(event) {
    event.preventDefault();

    hideProfileMessage();

    try {
        validateProfileForm();

    } catch (error) {
        showProfileMessage(
            error.message
        );

        return;
    }

    setProfileSaveLoading(true);

    try {
        const formData =
            buildProfileFormData();

        const response =
            await updateCurrentUserProfile(
                formData
            );

        const updatedUser =
            response.user;

        selectedProfileImage = null;

        const imageInput =
            getProfileElement(
                "profile-image-input"
            );

        if (imageInput) {
            imageInput.value = "";
        }

        renderProfileUser(
            updatedUser
        );

        localStorage.setItem(
            PROFILE_STORAGE_KEYS.currentUser,
            JSON.stringify(updatedUser)
        );

        showProfileMessage(
            response.message ||
            "Profile updated successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Profile update error:",
            error
        );

        if (error.status === 401) {
            clearProfileSession();
            redirectToProfileLogin();
            return;
        }

        showProfileMessage(
            error.message ||
            "Unable to update profile."
        );

    } finally {
        setProfileSaveLoading(false);
    }
}


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        getProfileElement(
            "profile-form"
        )?.addEventListener(
            "submit",
            handleProfileSubmit
        );

        getProfileElement(
            "profile-image-input"
        )?.addEventListener(
            "change",
            handleProfileImageSelection
        );

        getProfileElement(
            "profile-bio"
        )?.addEventListener(
            "input",
            updateBioCharacterCount
        );

        getProfileElement(
            "profile-logout-button"
        )?.addEventListener(
            "click",
            profileLogout
        );

        

        loadProfile();
    }
);