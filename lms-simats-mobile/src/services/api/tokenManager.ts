export let token: string | null = null;
let logoutCallback: (() => void) | null = null;

export const getToken = () => token;

export const setToken = (newToken: string | null) => {
    token = newToken;
};

export const registerLogoutCallback = (cb: () => void) => {
    logoutCallback = cb;
};

export const triggerLogout = () => {
    if (logoutCallback) {
        logoutCallback();
    }
};
