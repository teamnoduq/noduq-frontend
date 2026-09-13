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
};

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
  createdAt: string;
};

export type CreatedEmployee = {
  id: string;
  branchId: string;
  displayName: string;
  username: string;
  active: boolean;
  code: string;
};
