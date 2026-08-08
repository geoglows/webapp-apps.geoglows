// Everything that touches a session: the Supabase client, the sign-in modal,
// the header's auth control, and the profile form. Loaded on demand by
// app.js, and only on pages that have an #authActionSlot.
//
// No HTML is built here. The markup is static in index.html / profile.html;
// this file only sets textContent, sets input values, and flips [hidden].
// That is why nothing needs escaping.

import "@geoglows/geoglows-auth/core/sign-in.css";
import {
  bootstrapSession,
  createGeoglowsSupabaseClient,
  createSupabaseAuthAdapter,
  detectRecoveryUrlState,
  getUserDisplayInfo,
  isProfileComplete,
  loadAccountSummary,
  mountSignInModal,
  renderAuthAction,
  updateProfile,
} from "@geoglows/geoglows-auth/core";
import { explicitHtml } from "./urls.js";

const supabase = createGeoglowsSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

// The portal is served from the domain root, so its root is just the origin.
const portalRoot = window.location.origin;

// Bare portal root, not root+pathname: mountSignInModal passes its own redirect
// targets (both defaulting to it), and from /profile this fallback
// would otherwise resolve to a URL that isn't in the Supabase allowlist.
const portalHome = explicitHtml(portalRoot);
const auth = createSupabaseAuthAdapter({
  supabase,
  defaultRedirectTo: portalHome,
  logoutRedirectTo: portalHome,
});

const state = {
  status: "bootstrapping",
  user: null,
  account: null,
  action: null,
  editing: false,
  error: null,
  success: false,
};

let modal;
let slot;
let profile = null; // profile-page elements, or null on the home page

const show = (el, on) => { el.hidden = !on; };

export function start() {
  slot = document.getElementById("authActionSlot");
  profile = queryProfileElements();

  modal = mountSignInModal({ authAdapter: auth });

  // Closes the avatar dropdown on an outside click. Bound once, and it
  // re-queries the wrapper each time, so it survives slot re-renders.
  document.addEventListener("click", (event) => {
    const details = document.querySelector(".geoglows-auth-action-avatar-wrapper");
    if (details?.open && !details.contains(event.target)) details.open = false;
  });

  if (profile) bindProfileEvents();

  render();
  startSession();
}

/* ---------------------------------------------------------------- session */

function startSession() {
  // Supabase JS's detectSessionInUrl consumes the recovery hash during its own
  // init, so read the snapshot the page's inline <script> captured first.
  const url = window.__GEOGLOWS_INITIAL_URL__ ?? {
    hash: window.location.hash,
    search: window.location.search,
  };
  const recovery = detectRecoveryUrlState(url);
  const isRecoveryFlow = recovery.kind !== "none";

  if (recovery.kind === "expired" || recovery.kind === "pkce-unsupported") {
    modal.open({ view: "recoveryError" });
  }

  let bootstrapped = false;

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION" && !bootstrapped) {
      bootstrapped = true;
      bootstrap();
      stripAuthArtifacts();
      return;
    }
    if (event === "SIGNED_OUT") {
      // The adapter already hard-navigates to the origin. This just flips the
      // header to anonymous in the tick before that lands.
      bootstrap();
      return;
    }
    if (event === "SIGNED_IN") {
      // Supabase re-fires SIGNED_IN on every visibility-change revalidation.
      // Skip it when it's the user we already have.
      const sub = state.user?.sub;
      if (!sub || session?.user?.id !== sub) bootstrap();
      return;
    }
    if (event === "PASSWORD_RECOVERY") {
      // Fires in every tab that revalidates a recovery session, including tabs
      // that never received the email link. Only this tab should prompt.
      if (isRecoveryFlow) modal.open({ view: "setNewPassword" });
    }
  });

  // If INITIAL_SESSION never arrives, bootstrap anyway so the header doesn't
  // stick on "Signing in…".
  setTimeout(() => {
    if (!bootstrapped) {
      bootstrapped = true;
      bootstrap();
    }
  }, 2000);
}

function bootstrap() {
  bootstrapSession({
    auth,
    supabase,
    // Carry the known user through the transient loading phases so the avatar
    // never flickers back to "Signing in…" on a re-bootstrap.
    initialState: state.user
      ? { status: state.status, user: state.user, account: state.account, error: null }
      : null,
    onStateChange: (session) => {
      Object.assign(state, {
        status: session.status,
        user: session.user,
        account: session.account,
      });
      render();
    },
  }).catch((error) => {
    console.error("Session bootstrap failed:", error);
    setState({ status: "error", error: "Unable to connect. Please refresh the page or try again later." });
  });
}

/** Strips OAuth callback artifacts so a reload doesn't replay the flow. */
function stripAuthArtifacts() {
  const hashHasToken = /(?:^|[#&])access_token=/.test(window.location.hash);
  const search = new URLSearchParams(window.location.search);
  const queryHasCode = search.has("code") && search.has("state");
  if (!hashHasToken && !queryHasCode) return;

  search.delete("code");
  search.delete("state");
  const query = search.toString();
  history.replaceState({}, document.title, window.location.pathname + (query ? `?${query}` : ""));
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

/* ----------------------------------------------------------------- header */

function render() {
  slot.innerHTML = renderAuthAction(state, {
    profileHref: explicitHtml(`${portalRoot}/profile`, { page: true }),
  });
  slot.querySelector("#geoglowsSignIn")?.addEventListener("click", () => modal.open());
  slot.querySelector("#geoglowsSignOut")?.addEventListener("click", signOut);
  if (profile) renderProfile();
}

async function signOut() {
  setState({ action: "signing_out" });
  try {
    await auth.signOutRedirect();
  } catch (error) {
    console.error("Sign out failed:", error);
    setState({ action: null, error: "Sign out failed. Please try again." });
  }
}

/* ---------------------------------------------------------------- profile */

function queryProfileElements() {
  const form = document.getElementById("profileForm");
  if (!form) return null;

  const byId = (id) => document.getElementById(id);
  return {
    form,
    error: byId("profileError"),
    success: byId("profileSuccess"),
    incomplete: byId("profileIncomplete"),
    complete: byId("profileComplete"),
    signedOut: byId("profileSignedOut"),
    signIn: byId("profileSignIn"),
    view: byId("profileView"),
    initials: byId("profileInitials"),
    name: byId("profileName"),
    email: byId("profileEmail"),
    edit: byId("profileEdit"),
    cancel: byId("profileCancel"),
    submit: byId("profileSubmit"),
    formEmail: byId("profileFormEmail"),
    firstName: byId("viewFirstName"),
    middleName: byId("viewMiddleName"),
    lastName: byId("viewLastName"),
    userType: byId("viewUserType"),
    link: byId("viewUserLink"),
    linkEmpty: byId("viewUserLinkEmpty"),
  };
}

function bindProfileEvents() {
  profile.signIn.addEventListener("click", () => modal.open());
  profile.edit.addEventListener("click", () => startEditing());
  profile.complete.addEventListener("click", () => startEditing());
  profile.cancel.addEventListener("click", () => setState({ editing: false, error: null }));
  profile.form.addEventListener("submit", save);
}

function startEditing() {
  const row = state.account?.profile ?? {};
  const { elements } = profile.form;
  elements.first_name.value = row.first_name ?? "";
  elements.middle_name.value = row.middle_name ?? "";
  elements.last_name.value = row.last_name ?? "";
  elements.user_type.value = row.user_type ?? "";
  elements.user_link.value = row.user_link ?? "";
  setState({ editing: true, error: null, success: false });
}

function renderProfile() {
  const signedIn = Boolean(state.user);
  const row = state.account?.profile;
  const resolved = signedIn || state.status === "anonymous" || state.status === "error";

  show(profile.signedOut, resolved && !signedIn);
  show(profile.view, signedIn && !state.editing);
  show(profile.form, signedIn && state.editing);

  profile.error.textContent = state.error ?? "";
  show(profile.error, Boolean(state.error));
  show(profile.success, state.success);
  show(profile.incomplete, signedIn && !state.editing && Boolean(state.account) && !isProfileComplete(row));

  if (!signedIn) return;

  const { name, email, initials } = getUserDisplayInfo(state.user, state.account);
  profile.initials.textContent = initials;
  profile.name.textContent = name;
  profile.email.textContent = email;
  profile.formEmail.textContent = email;

  setField(profile.firstName, row?.first_name);
  setField(profile.middleName, row?.middle_name, "—");
  setField(profile.lastName, row?.last_name);
  setField(profile.userType, userTypeLabel(row?.user_type), "—");

  const href = safeHref(row?.user_link);
  show(profile.link, Boolean(href));
  show(profile.linkEmpty, !href);
  if (href) {
    profile.link.href = href;
    profile.link.textContent = row.user_link;
  }

  const saving = state.action === "saving_profile";
  profile.submit.textContent = saving ? "Saving…" : "Save changes";
  for (const field of profile.form.elements) field.disabled = saving;
}

async function save(event) {
  event.preventDefault();
  const { elements } = profile.form;
  const first = elements.first_name.value.trim();
  const last = elements.last_name.value.trim();
  const middle = elements.middle_name.value.trim();
  const type = elements.user_type.value;
  const link = elements.user_link.value.trim();

  if (!first) return setState({ error: "Please enter your first name." });
  if (!last) return setState({ error: "Please enter your last name." });
  if (link && !safeHref(link)) {
    return setState({ error: "Personal link must start with http:// or https://" });
  }

  setState({ action: "saving_profile", error: null });
  try {
    await updateProfile(supabase, {
      id: state.user.sub,
      first_name: first,
      middle_name: middle || null,
      last_name: last,
      user_type: type || null,
      user_link: link || null,
    });
    setState({
      account: await loadAccountSummary(supabase, state.user.sub),
      action: null,
      editing: false,
      success: true,
    });
    setTimeout(() => setState({ success: false }), 3000);
  } catch (error) {
    console.error("Profile update failed:", error);
    setState({ action: null, error: "We couldn't save your profile. Please try again." });
  }
}

function setField(el, value, empty = "Not provided") {
  el.textContent = value || empty;
  el.className = value
    ? "text-slate-800 dark:text-slate-200"
    : "italic text-slate-400 dark:text-slate-500";
}

/** Reads the label straight off the <select>, so the options live in one place. */
function userTypeLabel(value) {
  if (!value) return "";
  const option = [...profile.form.elements.user_type.options].find((o) => o.value === value);
  return option?.text ?? value;
}

function safeHref(value) {
  return /^https?:\/\//i.test(value ?? "") ? value : null;
}
