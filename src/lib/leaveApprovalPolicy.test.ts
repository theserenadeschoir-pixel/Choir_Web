import { describe, expect, it } from "vitest";
import {
  canApproveLeave,
  canApproveLeaveRequest,
  getLeaveApproversForRequest,
  isDisciplinaryLeaveRequester,
  type LeaveApprover,
} from "./leaveApprovalPolicy";

function makeAdmin(overrides: Partial<LeaveApprover> & Pick<LeaveApprover, "email" | "role">): LeaveApprover {
  return {
    isActive: true,
    ...overrides,
  };
}

describe("Leave approval permissions", () => {
  const superAdmin = makeAdmin({
    email: "aimable@choir.test",
    role: "super_admin",
    memberId: "m-aimable",
  });
  const disciplinaryOne = makeAdmin({
    email: "disc1@choir.test",
    role: "disciplinary",
    memberId: "m-disc-1",
  });
  const disciplinaryTwo = makeAdmin({
    email: "disc2@choir.test",
    role: "disciplinary",
    memberId: "m-disc-2",
  });
  const secretary = makeAdmin({
    email: "secretary@choir.test",
    role: "secretary",
    memberId: "m-sec",
  });
  const admins = [superAdmin, disciplinaryOne, disciplinaryTwo, secretary];

  it("lets only disciplinary officers and super admin approve leave at all", () => {
    expect(canApproveLeave(disciplinaryOne)).toBe(true);
    expect(canApproveLeave(superAdmin)).toBe(true);
    expect(canApproveLeave(secretary)).toBe(false);
  });

  it("lets disciplinary officers approve choir member leave, but not super admin", () => {
    const memberRequest = { memberId: "m-singer", memberEmail: "singer@choir.test" };

    expect(canApproveLeaveRequest(disciplinaryOne, memberRequest, admins)).toBe(true);
    expect(canApproveLeaveRequest(disciplinaryTwo, memberRequest, admins)).toBe(true);
    expect(canApproveLeaveRequest(superAdmin, memberRequest, admins)).toBe(false);
    expect(canApproveLeaveRequest(secretary, memberRequest, admins)).toBe(false);
  });

  it("lets only super admin approve disciplinary officers leave", () => {
    const disciplinaryRequest = { memberId: "m-disc-1", memberEmail: "disc1@choir.test" };

    expect(isDisciplinaryLeaveRequester(disciplinaryRequest, admins)).toBe(true);
    expect(canApproveLeaveRequest(superAdmin, disciplinaryRequest, admins)).toBe(true);
    expect(canApproveLeaveRequest(disciplinaryTwo, disciplinaryRequest, admins)).toBe(false);
    expect(canApproveLeaveRequest(disciplinaryOne, disciplinaryRequest, admins)).toBe(false);
  });

  it("notifies the matching approvers for each request type", () => {
    const memberApprovers = getLeaveApproversForRequest(
      { memberId: "m-singer", memberEmail: "singer@choir.test" },
      admins
    ).map((admin) => admin.email);
    const disciplinaryApprovers = getLeaveApproversForRequest(
      { memberId: "m-disc-2", memberEmail: "disc2@choir.test" },
      admins
    ).map((admin) => admin.email);

    expect(memberApprovers).toEqual(["disc1@choir.test", "disc2@choir.test"]);
    expect(disciplinaryApprovers).toEqual(["aimable@choir.test"]);
  });
});
