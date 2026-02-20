import { PrismaClient, Frequency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface DeptSeed {
  name: string;
  picName: string;
  reports: { name: string; frequency: string; description?: string; cutoffDays?: number }[];
  meetings: { name: string; frequency: string; description?: string }[];
}

const departments: DeptSeed[] = [
  {
    name: 'Management',
    picName: 'Management',
    reports: [],
    meetings: [
      { name: 'Quarterly KPI Review Meeting', frequency: 'QUARTERLY' },
      { name: 'Management Review Meeting', frequency: 'QUARTERLY' },
    ],
  },
  {
    name: 'HR',
    picName: 'Jiva',
    reports: [
      { name: "Weekly Worker's Headcount Report", frequency: 'WEEKLY' },
      { name: 'Recruitment Progress Report', frequency: 'WEEKLY' },
      { name: 'Training & Dev, Employee Engagement Activity Planning Report', frequency: 'WEEKLY' },
      { name: 'Permit Renewal, Fomema & COM Report', frequency: 'WEEKLY' },
      { name: 'Foreign Worker HC by Occupation and Site', frequency: 'WEEKLY' },
      { name: 'Day Worker Headcount Application Summary Report', frequency: 'MONTHLY' },
      { name: 'Basic Salary Approval Report', frequency: 'MONTHLY' },
      { name: 'Basic Wage Approval Report', frequency: 'MONTHLY' },
      { name: 'OT Salary Approval Report', frequency: 'MONTHLY' },
      { name: 'OT Wage Approval Report', frequency: 'MONTHLY' },
      { name: 'BG Operator Income Report', frequency: 'MONTHLY' },
      { name: 'Wages by Site', frequency: 'MONTHLY' },
      { name: 'Quarterly Workforce Analytics', frequency: 'QUARTERLY' },
      { name: 'HR Metrics Report', frequency: 'YEARLY' },
      { name: 'Annual Leave Utilization Report', frequency: 'YEARLY' },
      { name: 'Performance Appraisal Summary', frequency: 'YEARLY' },
      { name: 'Workforce Planning & Succession Report', frequency: 'YEARLY' },
      { name: 'Compensation & Benefits Review', frequency: 'YEARLY' },
      { name: 'Employee Engagement & Culture Report', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Monthly Dept Meeting', frequency: 'MONTHLY' },
      { name: 'Monthly HR-Management Meeting', frequency: 'MONTHLY' },
      { name: 'Year End Staff Performance Review Meeting', frequency: 'YEARLY' },
    ],
  },
  {
    name: 'Finance',
    picName: 'KD',
    reports: [
      { name: 'Cash Flow Stand-up', frequency: 'DAILY' },
      { name: 'Cash Flow Overview', frequency: 'WEEKLY' },
      { name: 'Purchases Review', frequency: 'WEEKLY' },
      { name: 'Project Costing Update (Cert, Claims, VO etc)', frequency: 'WEEKLY' },
      { name: 'Project Costing Report (Performance Analysis, LD, Dispute Listing)', frequency: 'MONTHLY' },
      { name: 'Credit Control and Debt Recovery (Payment Plans and Collection)', frequency: 'MONTHLY' },
      { name: 'Monthly Management Account (GSB, GESB, GPL and Group)', frequency: 'MONTHLY' },
      { name: 'IPO Proceeds Monitoring', frequency: 'MONTHLY' },
      { name: 'CAPEX Report & Borrowings', frequency: 'MONTHLY' },
      { name: 'Machine Utilisation Rate', frequency: 'MONTHLY' },
      { name: 'Order Book Update and Review', frequency: 'MONTHLY' },
      { name: 'Quarterly Business Review', frequency: 'QUARTERLY' },
      { name: 'Quarterly ARMC & BOD and Announcement', frequency: 'QUARTERLY' },
      { name: 'Internal Audit & Risk Update to BOD', frequency: 'QUARTERLY' },
      { name: 'Profit Take-up & Revenue Recognition', frequency: 'QUARTERLY' },
      { name: 'Internal Audit Report', frequency: 'QUARTERLY' },
      { name: 'Stock Count (Quarterly)', frequency: 'QUARTERLY' },
      { name: 'Geohan Annual Business Review Meeting', frequency: 'YEARLY' },
      { name: 'Geohan AGM (APM, IA Plan)', frequency: 'YEARLY' },
      { name: 'Corporate Tax Planning Review (6th, 9th & 11th)', frequency: 'YEARLY' },
      { name: 'Risk Management Framework Review', frequency: 'YEARLY' },
      { name: 'Strategic Business Planning and Budget', frequency: 'YEARLY' },
      { name: 'Annual Stock Count', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Monthly Dept Meeting', frequency: 'MONTHLY' },
      { name: 'Quarterly Board Meeting', frequency: 'QUARTERLY' },
      { name: 'Quarterly Business Review Meeting', frequency: 'QUARTERLY' },
      { name: 'Collection Meetings', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'Design',
    picName: 'Carmen',
    reports: [
      { name: 'Project Progress Report', frequency: 'MONTHLY' },
      { name: 'Task Arrangement Report', frequency: 'MONTHLY' },
      { name: 'Departmental Activities Report', frequency: 'MONTHLY' },
      { name: 'CPD Report', frequency: 'QUARTERLY' },
      { name: 'Test Pile Failure Report', frequency: 'QUARTERLY' },
      { name: 'Design Optimisation Report', frequency: 'QUARTERLY' },
      { name: 'Design Fee Over Budget Report', frequency: 'QUARTERLY' },
      { name: 'CPD Report (Yearly)', frequency: 'YEARLY' },
      { name: 'Test Pile Failure Report (Yearly)', frequency: 'YEARLY' },
      { name: 'Design Optimisation Report (Yearly)', frequency: 'YEARLY' },
      { name: 'Design Fee Over Budget Report (Yearly)', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Dept Meeting', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'Commercial & Contract',
    picName: 'Alvin',
    reports: [
      { name: 'Monthly Job Secured Report', frequency: 'WEEKLY' },
      { name: 'Monthly Payment Collection Report', frequency: 'WEEKLY' },
      { name: 'Monthly Business Review Report', frequency: 'WEEKLY' },
      { name: 'Monthly Claim Payment Status Report', frequency: 'WEEKLY' },
      { name: 'Monthly Job Secured Report (Monthly)', frequency: 'MONTHLY' },
      { name: 'Monthly Payment Collection Report (Monthly)', frequency: 'MONTHLY' },
      { name: 'Quarterly Job Secured Report', frequency: 'QUARTERLY' },
      { name: 'Quarterly Payment Collection Report', frequency: 'QUARTERLY' },
      { name: 'Quarterly Subcontract Profit Report', frequency: 'QUARTERLY' },
      { name: 'Quarterly CPD Report', frequency: 'QUARTERLY' },
      { name: 'Job Secured Report (Yearly)', frequency: 'YEARLY' },
      { name: 'Payment Collection Report (Yearly)', frequency: 'YEARLY' },
      { name: 'Subcontract Profit Report (Yearly)', frequency: 'YEARLY' },
      { name: 'CPD Report (Yearly)', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Internal Department Meeting', frequency: 'MONTHLY' },
      { name: 'Internal Project Kick-off Meeting', frequency: 'PROJECT_COMPLETION' },
      { name: 'Weekly Internal Site Meeting', frequency: 'WEEKLY' },
    ],
  },
  {
    name: 'Purchasing',
    picName: 'Choo',
    reports: [
      { name: 'Monthly Major Material Budget Price vs Cost Report', frequency: 'MONTHLY' },
      { name: 'Monthly Major Material Budget Quantity vs Purchase Quantity', frequency: 'MONTHLY' },
      { name: 'Procurement Optimisation Scoring Report (Monthly)', frequency: 'MONTHLY' },
      { name: 'Quarterly Major Material Budget Price vs Cost Report', frequency: 'QUARTERLY' },
      { name: 'Quarterly Major Material Budget Quantity vs Purchase Quantity', frequency: 'QUARTERLY' },
      { name: 'Procurement Optimisation Scoring Report (Quarterly)', frequency: 'QUARTERLY' },
      { name: 'Yearly Major Material Budget Price vs Cost Report', frequency: 'YEARLY' },
      { name: 'Yearly Major Material Budget Quantity vs Purchase Quantity', frequency: 'YEARLY' },
      { name: 'Procurement Optimisation Scoring Report (Yearly)', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Monthly Departmental Meeting', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'Admin',
    picName: 'Joseph',
    reports: [
      { name: 'Admin Variable Report', frequency: 'MONTHLY' },
      { name: 'Budget vs Expenses Report', frequency: 'QUARTERLY' },
      { name: 'Sustainability Report', frequency: 'YEARLY' },
      { name: 'QESH Audit Report', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Dept Meeting', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'IT',
    picName: 'Jie Min',
    reports: [
      { name: 'IT Projects Progress', frequency: 'MONTHLY' },
      { name: 'IT Workflow Improvement', frequency: 'MONTHLY' },
      { name: 'IT Incident Report', frequency: 'MONTHLY' },
      { name: 'KPI Review', frequency: 'QUARTERLY' },
      { name: 'Yearly Budget and Expenses Review', frequency: 'YEARLY' },
      { name: 'Yearly KPI Review', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'IT Department Monthly Meeting', frequency: 'MONTHLY' },
      { name: 'Progress Update with Management', frequency: 'MONTHLY' },
      { name: 'Quarterly Progress Discussion and Roadmap Review', frequency: 'QUARTERLY' },
      { name: 'Yearly Roadmap Review', frequency: 'YEARLY' },
    ],
  },
  {
    name: 'ESH',
    picName: 'Steward',
    reports: [
      { name: 'Weekly OSH Program', frequency: 'WEEKLY' },
      { name: 'Weekly TBM', frequency: 'WEEKLY' },
      { name: 'Weekly Accident Report for TM', frequency: 'WEEKLY' },
      { name: 'Machinery Transfer', frequency: 'WEEKLY' },
      { name: 'Weekly Sharing by Region Group', frequency: 'WEEKLY' },
      { name: 'Manhours Report', frequency: 'MONTHLY' },
      { name: 'Operation Meeting Report', frequency: 'MONTHLY' },
      { name: 'Monthly Safety Meeting at Project Site', frequency: 'MONTHLY' },
      { name: 'Site Registration JKKP12', frequency: 'MONTHLY' },
      { name: 'Monthly Training Plan', frequency: 'MONTHLY' },
      { name: 'Safety Meeting Report', frequency: 'QUARTERLY' },
      { name: 'Safety Improvement Meeting Report', frequency: 'QUARTERLY' },
      { name: 'Safety Walkabout Report', frequency: 'QUARTERLY' },
      { name: 'Project Scoring System (PSS)', frequency: 'QUARTERLY' },
      { name: 'Lifting Gear Inspection Report', frequency: 'QUARTERLY' },
      { name: 'Fire Extinguisher Maintenance Report', frequency: 'QUARTERLY' },
      { name: 'JKKP 8 Report', frequency: 'YEARLY' },
      { name: 'Emergency Drill Report', frequency: 'YEARLY' },
      { name: 'Internal & External Audit Report', frequency: 'YEARLY' },
      { name: 'Yearly Training Plan', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Monthly Site Safety Meeting', frequency: 'MONTHLY' },
      { name: 'Improvement Meeting', frequency: 'MONTHLY' },
      { name: 'Operation Meeting', frequency: 'MONTHLY' },
      { name: 'Safety Meeting', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'Projects',
    picName: 'Dr Lai',
    reports: [
      { name: 'Daily Project Progress Report', frequency: 'DAILY' },
      { name: 'Bi-weekly Consultant Progress Report', frequency: 'WEEKLY' },
      { name: 'Borepile Revenue Report', frequency: 'MONTHLY' },
      { name: 'Project Closing Report', frequency: 'PROJECT_COMPLETION' },
    ],
    meetings: [
      { name: 'Kick Off Meeting', frequency: 'PROJECT_COMPLETION' },
      { name: 'Weekly Coordination Meeting', frequency: 'WEEKLY' },
      { name: 'Progress Meeting', frequency: 'MONTHLY' },
      { name: 'Operation Meeting', frequency: 'MONTHLY' },
      { name: 'Production Meeting', frequency: 'MONTHLY' },
      { name: 'Senior Management Meeting', frequency: 'MONTHLY' },
      { name: 'Borepile Rocket Meeting', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'Drilling Centre',
    picName: 'Wong Chee Weng',
    reports: [
      { name: 'Daily DC and Site Repair Reporting', frequency: 'DAILY' },
      { name: 'Weekly Meeting with DC Member', frequency: 'WEEKLY' },
      { name: 'BBST Meeting Report', frequency: 'WEEKLY' },
      { name: 'BP Meeting Report', frequency: 'WEEKLY' },
      { name: 'Repairing Report of Kelly Bar and Tools', frequency: 'MONTHLY' },
      { name: 'Inventory, Tools and Kelly Bar Repair and Cost', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Weekly DC Member Meeting', frequency: 'WEEKLY' },
      { name: 'BBST Meeting', frequency: 'WEEKLY' },
      { name: 'BP Meeting', frequency: 'WEEKLY' },
    ],
  },
  {
    name: 'BP Operations',
    picName: 'Hoo KS',
    reports: [
      { name: 'BG Deployment Summary', frequency: 'WEEKLY' },
      { name: 'BP Summary', frequency: 'WEEKLY' },
    ],
    meetings: [
      { name: 'Weekly Site Meetings', frequency: 'WEEKLY' },
      { name: 'Weekly BP Meeting with PD', frequency: 'WEEKLY' },
    ],
  },
  {
    name: 'Crane Operations',
    picName: 'Wong Chee Weng',
    reports: [
      { name: 'Crane Operator Discussion Report', frequency: 'WEEKLY', description: 'In Bored Pile weekly meeting' },
    ],
    meetings: [
      { name: 'Quarterly Crane Operation Review', frequency: 'QUARTERLY' },
    ],
  },
  {
    name: 'Equipment',
    picName: 'Low TJ',
    reports: [
      { name: 'Weekly Internal & External Hiring Report', frequency: 'WEEKLY' },
      { name: 'Monthly External & Internal Hiring Report', frequency: 'MONTHLY' },
      { name: 'Monthly Steel Plate Report', frequency: 'MONTHLY' },
      { name: 'Yearly Internal & External Hiring Report', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Monthly PIC Meeting', frequency: 'MONTHLY' },
      { name: 'Workshop Weekly Meeting', frequency: 'WEEKLY' },
      { name: 'Workshop Monthly Meeting', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'GESB - Purchasing',
    picName: 'Stella',
    reports: [
      { name: 'Inventory of Asset Updating', frequency: 'DAILY' },
      { name: 'Diesel Purchase Report (Weekly)', frequency: 'WEEKLY' },
      { name: 'Spare Parts Purchase Report', frequency: 'MONTHLY' },
      { name: 'Monthly Diesel Purchase Report', frequency: 'MONTHLY' },
      { name: 'Internal Transport & Hiring Report', frequency: 'MONTHLY' },
      { name: 'External Transport Charges Report', frequency: 'MONTHLY' },
      { name: 'Internal Hiring Sales Report', frequency: 'MONTHLY' },
      { name: 'Quarterly Schedule Maintenance Budget Price vs Cost Report', frequency: 'QUARTERLY' },
      { name: 'Quarterly Bulk Order Budget Quantity vs Purchase Quantity', frequency: 'QUARTERLY' },
      { name: 'Procurement Optimisation Scoring Report (Quarterly)', frequency: 'QUARTERLY' },
      { name: 'Yearly Schedule Maintenance Budget Price vs Cost Report', frequency: 'YEARLY' },
      { name: 'Yearly Bulk Order Budget Quantity vs Purchase Quantity', frequency: 'YEARLY' },
      { name: 'End Year Procurement Optimisation Scoring Report', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Dept Monthly Meeting', frequency: 'MONTHLY' },
      { name: 'Workshop Weekly Meeting', frequency: 'WEEKLY' },
      { name: 'Workshop Monthly Meeting', frequency: 'MONTHLY' },
    ],
  },
  {
    name: 'Workshop',
    picName: 'Tang JJ',
    reports: [
      { name: 'Machine Breakdown and Repair Report', frequency: 'DAILY', description: 'Case by case' },
      { name: 'Swivel Greasing Report', frequency: 'DAILY', description: 'Individually by operator' },
      { name: 'Weekly BG and Micropile Machine Repair Report at Workshop', frequency: 'WEEKLY' },
      { name: 'Weekly Power Tools Report (Caisson)', frequency: 'WEEKLY' },
      { name: 'Small Machine Internal and External Hiring', frequency: 'WEEKLY' },
      { name: 'Monthly 5S Report', frequency: 'MONTHLY' },
      { name: 'Downtime Report', frequency: 'MONTHLY' },
      { name: 'Monthly Site Repair Report', frequency: 'MONTHLY' },
      { name: 'Monthly Hydraulic Oil Consumption Report', frequency: 'MONTHLY' },
      { name: 'Monthly Power Tools Report (Caisson)', frequency: 'MONTHLY' },
      { name: 'Monthly Safety Report', frequency: 'MONTHLY' },
      { name: 'BG Major and Minor Service and Overhaul Plan (incl oil test results)', frequency: 'MONTHLY' },
      { name: 'Monthly Status of Major Machines', frequency: 'MONTHLY' },
      { name: 'CAPEX Review', frequency: 'QUARTERLY' },
      { name: 'Maintenance Cost Estimate', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Monthly PIC Meeting', frequency: 'MONTHLY' },
      { name: 'Workshop & Warehouse Weekly Meeting', frequency: 'WEEKLY' },
      { name: 'Workshop & Warehouse Monthly Meeting', frequency: 'MONTHLY' },
      { name: 'Daily Mechanic and Logistic Briefing', frequency: 'DAILY' },
      { name: 'Weekly Toolbox Meeting', frequency: 'WEEKLY' },
      { name: 'Quarterly BG Operator Sharing', frequency: 'QUARTERLY' },
      { name: 'Quarterly Mechanics Sharing', frequency: 'QUARTERLY' },
      { name: 'Weekly MRO Internal Update', frequency: 'WEEKLY' },
    ],
  },
  {
    name: 'Logistic',
    picName: 'Farid',
    reports: [
      { name: 'Daily Truck Arrangement', frequency: 'DAILY' },
      { name: 'Weekly External & Internal Transport Report', frequency: 'WEEKLY' },
      { name: 'Monthly External & Internal Transport Report', frequency: 'MONTHLY' },
      { name: 'Monthly Water Truck Rental Report (Ext & Int)', frequency: 'MONTHLY' },
      { name: 'Yearly Ext & Int Transport Report', frequency: 'YEARLY' },
      { name: 'Yearly Water Truck Rental Report', frequency: 'YEARLY' },
      { name: 'Year End Stock Check Report', frequency: 'YEARLY' },
    ],
    meetings: [
      { name: 'Monthly PIC Meeting', frequency: 'MONTHLY' },
      { name: 'Workshop & Warehouse Weekly Meeting', frequency: 'WEEKLY' },
      { name: 'Workshop & Warehouse Monthly Meeting', frequency: 'MONTHLY' },
      { name: 'Daily Mechanic and Logistic Briefing', frequency: 'DAILY' },
      { name: 'Weekly Toolbox Meeting', frequency: 'WEEKLY' },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  // Create super admin
  const adminHash = await bcrypt.hash('Admin@123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@geohan.com' },
    update: {},
    create: {
      email: 'admin@geohan.com',
      name: 'System Admin',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Admin user: ${admin.email}`);

  for (const deptData of departments) {
    const dept = await prisma.department.upsert({
      where: { name: deptData.name },
      update: { picName: deptData.picName },
      create: { name: deptData.name, picName: deptData.picName },
    });
    console.log(`Department: ${dept.name}`);

    // Create HOD user for each department
    const hodEmail = `${deptData.picName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@geohan.com`;
    const hodHash = await bcrypt.hash('Hod@123!', 12);
    await prisma.user.upsert({
      where: { email: hodEmail },
      update: {},
      create: {
        email: hodEmail,
        name: deptData.picName,
        passwordHash: hodHash,
        role: 'HOD',
        departmentId: dept.id,
      },
    });

    for (const r of deptData.reports) {
      await prisma.reportType.upsert({
        where: { name_departmentId: { name: r.name, departmentId: dept.id } },
        update: {},
        create: {
          name: r.name,
          departmentId: dept.id,
          frequency: r.frequency as Frequency,
          description: r.description || null,
          cutoffDays: r.cutoffDays ?? 3,
          toleranceDays: 2,
        },
      });
    }

    for (const m of deptData.meetings) {
      await prisma.meetingType.upsert({
        where: { name_departmentId: { name: m.name, departmentId: dept.id } },
        update: {},
        create: {
          name: m.name,
          departmentId: dept.id,
          frequency: m.frequency as Frequency,
          description: m.description || null,
        },
      });
    }
  }

  console.log('Seed complete!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Admin:  admin@geohan.com / Admin@123!');
  console.log('  HOD:    <picname>@geohan.com / Hod@123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
