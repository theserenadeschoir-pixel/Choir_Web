export type LeaveRequesterIdentity = {
  memberId?: string | null;
  memberEmail?: string | null;
};

export type LeaveApprover = {
  email: string;
  role: string;
  isActive: boolean;
  memberId?: string | null;
};

function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

export function adminMatchesLeaveRequester(
  admin: Pick<LeaveApprover, "memberId" | "email">,
  identity: LeaveRequesterIdentity
): boolean {
  if (identity.memberId && admin.memberId && identity.memberId === admin.memberId) {
    return true;
  }
  const requesterEmail = normalizeEmail(identity.memberEmail);
  return Boolean(requesterEmail && normalizeEmail(admin.email) === requesterEmail);
}

export function isDisciplinaryLeaveRequester(
  identity: LeaveRequesterIdentity,
  admins: LeaveApprover[]
): boolean {
  return admins.some(
    (admin) =>
      admin.isActive &&
      admin.role === "disciplinary" &&
      adminMatchesLeaveRequester(admin, identity)
  );
}

/** Coarse check: this role can approve some leave requests. */
export function canApproveLeave(user: LeaveApprover | null): boolean {
  if (!user || !user.isActive) return false;
  return user.role === "disciplinary" || user.role === "super_admin";
}

export function canApproveLeaveRequest(
  user: LeaveApprover | null,
  request: LeaveRequesterIdentity,
  admins: LeaveApprover[]
): boolean {
  if (!user || !user.isActive) return false;
  if (adminMatchesLeaveRequester(user, request)) return false;

  if (isDisciplinaryLeaveRequester(request, admins)) {
    return user.role === "super_admin";
  }

  return user.role === "disciplinary";
}

export function getLeaveApproversForRequest<T extends LeaveApprover>(
  request: LeaveRequesterIdentity,
  admins: T[]
): T[] {
  return admins.filter((admin) => canApproveLeaveRequest(admin, request, admins));
}
