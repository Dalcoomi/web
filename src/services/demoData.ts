type TransactionType = "INCOME" | "EXPENSE";

interface DemoMember {
  memberId: string;
  nickname: string;
  profileImageUrl: string;
}

export interface DemoCategory {
  id: number;
  name: string;
  iconUrl: string;
  ownerType: "USER" | "SYSTEM";
  transactionType: TransactionType;
  teamId: number | null;
}

export interface DemoTransaction {
  transactionId: string;
  teamId: number | null;
  amount: number;
  content: string;
  transactionDate: string;
  transactionType: TransactionType;
  creatorNickname: string;
  creatorProfileImageUrl?: string | null;
  categoryId: number;
  categoryName: string;
  iconUrl: string;
}

interface DemoGroup {
  teamId: string;
  title: string;
  label: string;
  purpose: string;
  memberLimit: number;
  invitationCode: string;
  leaderNickname: string;
  members: DemoMember[];
}

const defaultAvatars = [
  process.env.NEXT_PUBLIC_DEFAULT_AVATAR_1 || "",
  process.env.NEXT_PUBLIC_DEFAULT_AVATAR_2 || "",
  process.env.NEXT_PUBLIC_DEFAULT_AVATAR_3 || "",
  process.env.NEXT_PUBLIC_DEFAULT_AVATAR_4 || "",
];

const avatarByIndex = (index: number) => defaultAvatars[index] ?? defaultAvatars[0] ?? "";

const demoSelfMember: DemoMember = {
  memberId: "demo-member-1",
  nickname: "체험유저1",
  profileImageUrl: avatarByIndex(0),
};

const demoMembers: DemoMember[] = [
  demoSelfMember,
  { memberId: "demo-member-2", nickname: "체험유저2", profileImageUrl: avatarByIndex(1) },
  { memberId: "demo-member-3", nickname: "체험유저3", profileImageUrl: avatarByIndex(2) },
  { memberId: "demo-member-4", nickname: "체험유저4", profileImageUrl: avatarByIndex(3) },
];

const createIsoDate = (monthOffset: number, day: number, hour: number) => {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, day, hour, 0, 0);
  return target.toISOString();
};

const nextInviteCode = () => {
  let code = "";
  while (code.length < 8) {
    code += Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }
  return code.slice(0, 8);
};

const CATEGORY_ICON = "/images/transaction/v2/리스트_카테고리.svg";

let categorySeedId = 0;
let transactionSeedId = 0;
let groupSeedId = 0;

const demoCategories: DemoCategory[] = [
  { id: 1, name: "식비", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: null },
  { id: 2, name: "카페", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: null },
  { id: 3, name: "교통", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: null },
  { id: 4, name: "쇼핑", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: null },
  { id: 5, name: "급여", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "INCOME", teamId: null },
  { id: 6, name: "용돈", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "INCOME", teamId: null },
  { id: 7, name: "사업수입", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "INCOME", teamId: null },

  { id: 101, name: "식비", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: 1 },
  { id: 102, name: "생활용품", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: 1 },
  { id: 103, name: "교통", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: 1 },
  { id: 104, name: "공동정산", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "INCOME", teamId: 1 },
  { id: 105, name: "용돈", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "INCOME", teamId: 1 },

  { id: 201, name: "식비", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: 2 },
  { id: 202, name: "주거", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: 2 },
  { id: 203, name: "간식", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "EXPENSE", teamId: 2 },
  { id: 204, name: "공동정산", iconUrl: CATEGORY_ICON, ownerType: "SYSTEM", transactionType: "INCOME", teamId: 2 },
];

const demoGroups: DemoGroup[] = [
  {
    teamId: "1",
    title: "체험 그룹 A",
    label: "green",
    purpose: "생활비 같이 관리",
    memberLimit: 10,
    invitationCode: "DEMO2026",
    leaderNickname: "체험유저1",
    members: [...demoMembers],
  },
  {
    teamId: "2",
    title: "체험 그룹 B",
    label: "orange",
    purpose: "모임비 정산",
    memberLimit: 8,
    invitationCode: "DEMO2027",
    leaderNickname: "체험유저2",
    members: [...demoMembers],
  },
];

let demoTransactions: DemoTransaction[] = [
  {
    transactionId: "3001",
    teamId: null,
    amount: 8500,
    content: "점심 식사",
    transactionDate: createIsoDate(0, 2, 12),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 1,
    categoryName: "식비",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3002",
    teamId: null,
    amount: 5200,
    content: "아이스라떼",
    transactionDate: createIsoDate(0, 3, 9),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 2,
    categoryName: "카페",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3003",
    teamId: null,
    amount: 132000,
    content: "온라인 쇼핑",
    transactionDate: createIsoDate(0, 5, 20),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 4,
    categoryName: "쇼핑",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3004",
    teamId: null,
    amount: 3200000,
    content: "월급",
    transactionDate: createIsoDate(-1, 1, 9),
    transactionType: "INCOME",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 5,
    categoryName: "급여",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3005",
    teamId: null,
    amount: 50000,
    content: "부모님 용돈",
    transactionDate: createIsoDate(-2, 7, 19),
    transactionType: "INCOME",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 6,
    categoryName: "용돈",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3006",
    teamId: null,
    amount: 14500,
    content: "지하철 정기권",
    transactionDate: createIsoDate(-1, 9, 8),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 3,
    categoryName: "교통",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3007",
    teamId: null,
    amount: 9100,
    content: "저녁 식사",
    transactionDate: createIsoDate(0, 11, 18),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 1,
    categoryName: "식비",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3008",
    teamId: null,
    amount: 280000,
    content: "사이드 프로젝트 정산",
    transactionDate: createIsoDate(-2, 13, 14),
    transactionType: "INCOME",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 7,
    categoryName: "사업수입",
    iconUrl: CATEGORY_ICON,
  },

  {
    transactionId: "3101",
    teamId: 1,
    amount: 26000,
    content: "마트 장보기",
    transactionDate: createIsoDate(0, 2, 18),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저2",
    creatorProfileImageUrl: avatarByIndex(1),
    categoryId: 102,
    categoryName: "생활용품",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3102",
    teamId: 1,
    amount: 12000,
    content: "점심 회비",
    transactionDate: createIsoDate(-1, 3, 13),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저3",
    creatorProfileImageUrl: avatarByIndex(2),
    categoryId: 101,
    categoryName: "식비",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3103",
    teamId: 1,
    amount: 18000,
    content: "택시비",
    transactionDate: createIsoDate(0, 5, 23),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저4",
    creatorProfileImageUrl: avatarByIndex(3),
    categoryId: 103,
    categoryName: "교통",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3104",
    teamId: 1,
    amount: 70000,
    content: "공동 정산 입금",
    transactionDate: createIsoDate(-2, 6, 10),
    transactionType: "INCOME",
    creatorNickname: "체험유저1",
    creatorProfileImageUrl: avatarByIndex(0),
    categoryId: 104,
    categoryName: "공동정산",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3105",
    teamId: 1,
    amount: 33000,
    content: "주말 외식",
    transactionDate: createIsoDate(-1, 9, 20),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저2",
    creatorProfileImageUrl: avatarByIndex(1),
    categoryId: 101,
    categoryName: "식비",
    iconUrl: CATEGORY_ICON,
  },

  {
    transactionId: "3201",
    teamId: 2,
    amount: 21000,
    content: "모임 간식",
    transactionDate: createIsoDate(0, 4, 16),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저3",
    creatorProfileImageUrl: avatarByIndex(2),
    categoryId: 203,
    categoryName: "간식",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3202",
    teamId: 2,
    amount: 150000,
    content: "회비 입금",
    transactionDate: createIsoDate(-1, 8, 11),
    transactionType: "INCOME",
    creatorNickname: "체험유저2",
    creatorProfileImageUrl: avatarByIndex(1),
    categoryId: 204,
    categoryName: "공동정산",
    iconUrl: CATEGORY_ICON,
  },
  {
    transactionId: "3203",
    teamId: 2,
    amount: 92000,
    content: "공간 대여비",
    transactionDate: createIsoDate(-2, 10, 15),
    transactionType: "EXPENSE",
    creatorNickname: "체험유저4",
    creatorProfileImageUrl: avatarByIndex(3),
    categoryId: 202,
    categoryName: "주거",
    iconUrl: CATEGORY_ICON,
  },
];

categorySeedId = demoCategories.reduce((maxId, category) => {
  return category.id > maxId ? category.id : maxId;
}, categorySeedId);

transactionSeedId = demoTransactions.reduce((maxId, transaction) => {
  const currentId = Number(transaction.transactionId);
  return currentId > maxId ? currentId : maxId;
}, transactionSeedId);

groupSeedId = demoGroups.reduce((maxId, group) => {
  const currentId = Number(group.teamId);
  return currentId > maxId ? currentId : maxId;
}, groupSeedId);

const findCategoryById = (categoryId: number) =>
  demoCategories.find((category) => category.id === categoryId);

export const getDemoSelfMember = () => demoSelfMember;

export const getDemoGroups = () => demoGroups;

export const getDemoGroupInfo = (teamId: string) =>
  demoGroups.find((group) => group.teamId === teamId) ?? null;

export const createDemoGroup = (payload: {
  title: string;
  memberLimit: number;
  purpose: string | null;
  label: string;
}) => {
  groupSeedId += 1;
  const teamId = String(groupSeedId);
  const invitationCode = nextInviteCode();

  demoGroups.unshift({
    teamId,
    title: payload.title,
    label: payload.label,
    purpose: payload.purpose ?? "",
    memberLimit: payload.memberLimit,
    invitationCode,
    leaderNickname: demoSelfMember.nickname,
    members: [demoSelfMember],
  });

  const defaultExpenseCategories = ["식비", "생활용품", "교통"];
  const defaultIncomeCategories = ["공동정산", "용돈"];

  defaultExpenseCategories.forEach((name) => {
    categorySeedId += 1;
    demoCategories.push({
      id: categorySeedId,
      name,
      iconUrl: CATEGORY_ICON,
      ownerType: "SYSTEM",
      transactionType: "EXPENSE",
      teamId: Number(teamId),
    });
  });

  defaultIncomeCategories.forEach((name) => {
    categorySeedId += 1;
    demoCategories.push({
      id: categorySeedId,
      name,
      iconUrl: CATEGORY_ICON,
      ownerType: "SYSTEM",
      transactionType: "INCOME",
      teamId: Number(teamId),
    });
  });

  return invitationCode;
};

export const updateDemoGroup = (payload: {
  teamId: string;
  title: string;
  memberLimit: number;
  purpose: string | null;
  label: string;
}) => {
  const target = demoGroups.find((group) => group.teamId === payload.teamId);
  if (!target) return;

  target.title = payload.title;
  target.memberLimit = payload.memberLimit;
  target.purpose = payload.purpose ?? "";
  target.label = payload.label;
};

export const joinDemoGroup = (invitationCode: string) => {
  const target = demoGroups.find(
    (group) => group.invitationCode.toUpperCase() === invitationCode.toUpperCase(),
  );
  if (!target) {
    throw new Error("초대코드를 찾을 수 없어요.");
  }

  if (!target.members.some((member) => member.nickname === demoSelfMember.nickname)) {
    target.members.push(demoSelfMember);
  }

  return { teamId: target.teamId, title: target.title };
};

export const leaveDemoGroup = (teamId: string, nextLeaderNickname?: string) => {
  const target = demoGroups.find((group) => group.teamId === teamId);
  if (!target) return;

  const isLeader = target.leaderNickname === demoSelfMember.nickname;
  if (isLeader && nextLeaderNickname) {
    target.leaderNickname = nextLeaderNickname;
  }

  target.members = target.members.filter(
    (member) => member.nickname !== demoSelfMember.nickname,
  );

  if (target.members.length === 0) {
    const index = demoGroups.findIndex((group) => group.teamId === teamId);
    if (index >= 0) demoGroups.splice(index, 1);
    demoTransactions = demoTransactions.filter(
      (transaction) => String(transaction.teamId) !== teamId,
    );
    for (let i = demoCategories.length - 1; i >= 0; i -= 1) {
      if (String(demoCategories[i].teamId ?? "") === teamId) {
        demoCategories.splice(i, 1);
      }
    }
  }
};

export const updateDemoGroupOrder = (
  orders: Array<{ teamId: string; displayOrder: number }>,
) => {
  const orderMap = new Map(orders.map((order) => [order.teamId, order.displayOrder]));
  demoGroups.sort((a, b) => (orderMap.get(a.teamId) ?? 0) - (orderMap.get(b.teamId) ?? 0));
};

export const getDemoCategories = (
  teamId: number | null,
  transactionType: TransactionType,
) =>
  demoCategories.filter(
    (category) =>
      category.teamId === teamId && category.transactionType === transactionType,
  );

export const addDemoTransaction = (payload: {
  categoryId: number;
  teamId?: number | null;
  amount: number;
  content: string | null;
  transactionDate: string;
  transactionType: TransactionType;
}) => {
  transactionSeedId += 1;
  const category = findCategoryById(payload.categoryId);

  demoTransactions.unshift({
    transactionId: String(transactionSeedId),
    teamId: payload.teamId ?? null,
    amount: payload.amount,
    content: payload.content ?? "",
    transactionDate: payload.transactionDate,
    transactionType: payload.transactionType,
    creatorNickname: demoSelfMember.nickname,
    creatorProfileImageUrl: demoSelfMember.profileImageUrl,
    categoryId: payload.categoryId,
    categoryName: category?.name ?? "기타",
    iconUrl: category?.iconUrl ?? CATEGORY_ICON,
  });
};

export const getDemoTransactionsByMonth = (criteria: {
  teamId?: number | null;
  year: number;
  month: number;
  categoryName?: string | null;
  creatorNickname?: string | null;
}) => {
  const items = demoTransactions.filter((transaction) => {
    const date = new Date(transaction.transactionDate);
    const sameTeam =
      criteria.teamId === null || criteria.teamId === undefined
        ? transaction.teamId === null
        : transaction.teamId === criteria.teamId;
    const sameYear = date.getFullYear() === criteria.year;
    const sameMonth = date.getMonth() + 1 === criteria.month;
    const sameCategory =
      !criteria.categoryName || transaction.categoryName === criteria.categoryName;
    const sameCreator =
      !criteria.creatorNickname ||
      transaction.creatorNickname === criteria.creatorNickname;

    return sameTeam && sameYear && sameMonth && sameCategory && sameCreator;
  });

  const income = items
    .filter((item) => item.transactionType === "INCOME")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const expense = items
    .filter((item) => item.transactionType === "EXPENSE")
    .reduce((acc, cur) => acc + cur.amount, 0);

  return {
    income,
    expense,
    total: income - expense,
    transactions: items,
  };
};

export const getDemoTransactionById = (transactionId: string, teamId?: string) => {
  const found = demoTransactions.find((item) => item.transactionId === transactionId);
  if (!found) return null;
  if (typeof teamId !== "undefined" && String(found.teamId ?? "") !== teamId) {
    return null;
  }
  return found;
};

export const updateDemoTransaction = (
  transactionId: string,
  payload: {
    categoryId: number;
    teamId?: number | null;
    amount: number;
    content: string | null;
    transactionDate: string;
    transactionType: TransactionType;
  },
) => {
  const target = demoTransactions.find((item) => item.transactionId === transactionId);
  if (!target) return;

  const category = findCategoryById(payload.categoryId);
  target.categoryId = payload.categoryId;
  target.teamId = payload.teamId ?? target.teamId;
  target.amount = payload.amount;
  target.content = payload.content ?? "";
  target.transactionDate = payload.transactionDate;
  target.transactionType = payload.transactionType;
  target.categoryName = category?.name ?? target.categoryName;
  target.iconUrl = category?.iconUrl ?? target.iconUrl;
};

export const deleteDemoTransaction = (transactionId: string) => {
  demoTransactions = demoTransactions.filter(
    (item) => item.transactionId !== transactionId,
  );
};

export const addDemoCategory = (
  teamId: number | null,
  transactionType: TransactionType,
  name: string,
) => {
  categorySeedId += 1;
  const next: DemoCategory = {
    id: categorySeedId,
    name,
    iconUrl: CATEGORY_ICON,
    ownerType: "USER",
    transactionType,
    teamId,
  };
  demoCategories.push(next);
  return next;
};
