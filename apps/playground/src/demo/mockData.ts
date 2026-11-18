export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "Active" | "On leave" | "Onboarding";
  createdAt: Date;
}

const firstNames = [
  "Amara",
  "Daniel",
  "Elena",
  "Jisoo",
  "Jordan",
  "Leila",
  "Mateo",
  "Priya",
  "Sofia",
  "Yuna",
];
const lastNames = [
  "Nguyen",
  "Silva",
  "Park",
  "Okafor",
  "Hernandez",
  "Martin",
  "Vega-López",
  "Sharma",
  "Watanabe",
  "Choi",
  "Williams",
  "Reed",
];
const teams = [
  { department: "Engineering", role: "Frontend Engineer" },
  { department: "Design", role: "Senior Product Designer" },
  { department: "Operations", role: "Customer Operations Lead" },
  { department: "Finance", role: "Financial Analyst" },
  { department: "People", role: "Talent Acquisition Specialist" },
  { department: "Security", role: "Information Security Engineer" },
];

const identities = lastNames.flatMap((lastName) =>
  firstNames.map((firstName) => ({
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
  })),
);
const dates = Array.from(
  { length: 730 },
  (_, index) => new Date(Date.UTC(2024, 0, 2 + index)),
);

function createEmployee(index: number): Employee {
  const { name, email } = identities[index % identities.length];
  const { department, role } = teams[index % teams.length];

  return {
    id: 1001 + index,
    name,
    email,
    department,
    role,
    status:
      index % 13 === 0 ? "Onboarding" : index % 9 === 0 ? "On leave" : "Active",
    createdAt: dates[index % dates.length],
  };
}

export function createEmployees(count: number): Employee[] {
  return Array.from({ length: count }, (_, index) => createEmployee(index));
}

export function prepareEmployees(
  count: number,
  onReady: (rows: Employee[], generationMs: number) => void,
) {
  const rows: Employee[] = [];
  let generationMs = 0;
  let timer = window.setTimeout(generateBatch, 0);

  function generateBatch() {
    const start = performance.now();

    do {
      const end = Math.min(rows.length + 128, count);
      while (rows.length < end) rows.push(createEmployee(rows.length));
    } while (rows.length < count && performance.now() - start < 4);

    generationMs += performance.now() - start;

    if (rows.length < count) {
      timer = window.setTimeout(generateBatch, 0);
    } else {
      onReady(rows, generationMs);
    }
  }

  return () => window.clearTimeout(timer);
}
