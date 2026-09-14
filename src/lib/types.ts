export type Profile = {
  id: string;
  displayName: string;
};

export type Organization = {
  id: string;
  name: string;
  smsPhone: string | null;
  merchantLast4: string | null;
};

export type Branch = {
  id: string;
  name: string;
};

export type Workspace = {
  profile: Profile;
  organization: Organization;
  role: "owner" | "employee" | string;
  branches: Branch[];
  plan: Plan;
};

export type Plan = {
  entitlement: string | null;
  status: string;
  periodEndsAt: string | null;
  active: boolean;
};

export function isPlanActive(workspace: Workspace | null | undefined): boolean {
  return workspace?.plan?.active === true;
}

export type EmployeeSessionPayload = {
  token: string;
  expiresAt: string;
  employee: Employee;
  organization: Organization;
  branch: Branch;
};

export type Employee = {
  id: string;
  branchId: string;
  displayName: string;
  username: string;
  active: boolean;
  lookbackDays: number;
  createdAt: string;
};

export type CreatedEmployee = {
  id: string;
  branchId: string;
  displayName: string;
  username: string;
  active: boolean;
  lookbackDays: number;
  code: string;
};

export type PaymentNotice = {
  id: string;
  source: string;
  payerName: string | null;
  amount: number | null;
  amountLabel: string | null;
  currency: string;
  occurredAt: string | null;
  receivedAt: string;
  readable: boolean;
  confirmedByEmail: boolean;
};

export type PaymentFeed = {
  notices: PaymentNotice[];
};
