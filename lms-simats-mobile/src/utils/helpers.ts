export const formatRole = (role: string | null) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
};
