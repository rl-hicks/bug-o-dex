export function logoutAndRedirect() {
  localStorage.removeItem("access_token");
  window.location.href = "/login";
}