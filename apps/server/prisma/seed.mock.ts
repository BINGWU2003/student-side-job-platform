import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/hash';

const prisma = new PrismaClient();

async function ensureUser(params: {
  username: string;
  password: string;
  phone: string;
  role: 'ADMIN' | 'EMPLOYER' | 'STUDENT';
}) {
  const hashed = await hashPassword(params.password);
  return prisma.user.upsert({
    where: { username: params.username },
    update: {
      phone: params.phone,
      role: params.role,
      status: 'ACTIVE',
    },
    create: {
      username: params.username,
      password: hashed,
      phone: params.phone,
      role: params.role,
      status: 'ACTIVE',
    },
  });
}

async function ensureAnnouncement(
  adminId: number,
  title: string,
  content: string,
  isPinned: boolean
) {
  const exists = await prisma.announcement.findFirst({ where: { title } });
  if (exists) return exists;
  return prisma.announcement.create({
    data: {
      title,
      content,
      isPinned,
      createdBy: adminId,
    },
  });
}

async function ensureJob(params: {
  employerId: number;
  title: string;
  type: 'PROMOTION' | 'TUTORING' | 'EVENT' | 'CATERING' | 'OTHER';
  salaryType: 'HOURLY' | 'TOTAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  rejectReason?: string;
}) {
  const exists = await prisma.job.findFirst({
    where: { employerId: params.employerId, title: params.title },
  });
  if (exists) return exists;

  return prisma.job.create({
    data: {
      employerId: params.employerId,
      title: params.title,
      type: params.type,
      description: `${params.title}（示例数据）`,
      location: '广州大学城',
      salary: params.salaryType === 'HOURLY' ? 35 : 320,
      salaryType: params.salaryType,
      headcount: 5,
      startDate: new Date('2026-04-20'),
      endDate: new Date('2026-04-30'),
      deadline: new Date('2026-04-18'),
      requirement: '责任心强，沟通顺畅',
      status: params.status,
      rejectReason: params.rejectReason ?? null,
    },
  });
}

async function main() {
  const admin = await ensureUser({
    username: 'admin',
    password: 'Admin@123456',
    phone: '13800000000',
    role: 'ADMIN',
  });

  const employerA = await ensureUser({
    username: 'demo_employer_1',
    password: 'Demo@123456',
    phone: '13900000001',
    role: 'EMPLOYER',
  });
  const employerB = await ensureUser({
    username: 'demo_employer_2',
    password: 'Demo@123456',
    phone: '13900000002',
    role: 'EMPLOYER',
  });

  const studentA = await ensureUser({
    username: 'demo_student_1',
    password: 'Demo@123456',
    phone: '13700000001',
    role: 'STUDENT',
  });
  const studentB = await ensureUser({
    username: 'demo_student_2',
    password: 'Demo@123456',
    phone: '13700000002',
    role: 'STUDENT',
  });
  const studentC = await ensureUser({
    username: 'demo_student_3',
    password: 'Demo@123456',
    phone: '13700000003',
    role: 'STUDENT',
  });

  await prisma.employerProfile.upsert({
    where: { userId: employerA.id },
    update: {
      companyName: '星火教育咨询',
      contactName: '王老师',
      description: '长期提供校内兼职机会',
    },
    create: {
      userId: employerA.id,
      companyName: '星火教育咨询',
      contactName: '王老师',
      description: '长期提供校内兼职机会',
    },
  });
  await prisma.employerProfile.upsert({
    where: { userId: employerB.id },
    update: {
      companyName: '青橙活动策划',
      contactName: '李经理',
      description: '专注会展与校园活动',
    },
    create: {
      userId: employerB.id,
      companyName: '青橙活动策划',
      contactName: '李经理',
      description: '专注会展与校园活动',
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: studentA.id },
    update: {
      realName: '张三',
      studentNo: '20260001',
      school: '华南理工大学',
      major: '计算机科学',
    },
    create: {
      userId: studentA.id,
      realName: '张三',
      studentNo: '20260001',
      school: '华南理工大学',
      major: '计算机科学',
    },
  });
  await prisma.studentProfile.upsert({
    where: { userId: studentB.id },
    update: { realName: '李四', studentNo: '20260002', school: '中山大学', major: '市场营销' },
    create: {
      userId: studentB.id,
      realName: '李四',
      studentNo: '20260002',
      school: '中山大学',
      major: '市场营销',
    },
  });
  await prisma.studentProfile.upsert({
    where: { userId: studentC.id },
    update: { realName: '王五', studentNo: '20260003', school: '暨南大学', major: '英语' },
    create: {
      userId: studentC.id,
      realName: '王五',
      studentNo: '20260003',
      school: '暨南大学',
      major: '英语',
    },
  });

  const jobA = await ensureJob({
    employerId: employerA.id,
    title: '[DEMO] 校园地推兼职',
    type: 'PROMOTION',
    salaryType: 'HOURLY',
    status: 'APPROVED',
  });

  const jobC = await ensureJob({
    employerId: employerB.id,
    title: '[DEMO] 展会协助兼职',
    type: 'EVENT',
    salaryType: 'TOTAL',
    status: 'CLOSED',
  });
  const jobD = await ensureJob({
    employerId: employerB.id,
    title: '[DEMO] 促销员招募',
    type: 'CATERING',
    salaryType: 'TOTAL',
    status: 'REJECTED',
    rejectReason: '岗位信息不完整，请补充工作内容细节',
  });

  const appA = await prisma.application.upsert({
    where: { jobId_studentId: { jobId: jobA.id, studentId: studentA.id } },
    update: { status: 'ACCEPTED', intro: '有地推经验，沟通能力强' },
    create: {
      jobId: jobA.id,
      studentId: studentA.id,
      status: 'ACCEPTED',
      intro: '有地推经验，沟通能力强',
    },
  });
  await prisma.application.upsert({
    where: { jobId_studentId: { jobId: jobA.id, studentId: studentB.id } },
    update: { status: 'PENDING', intro: '时间充裕，可长期兼职' },
    create: {
      jobId: jobA.id,
      studentId: studentB.id,
      status: 'PENDING',
      intro: '时间充裕，可长期兼职',
    },
  });
  await prisma.application.upsert({
    where: { jobId_studentId: { jobId: jobC.id, studentId: studentC.id } },
    update: { status: 'REJECTED', intro: '做过展会引导' },
    create: { jobId: jobC.id, studentId: studentC.id, status: 'REJECTED', intro: '做过展会引导' },
  });
  await prisma.review.upsert({
    where: { applicationId_fromUserId: { applicationId: appA.id, fromUserId: studentA.id } },
    update: { toUserId: employerA.id, rating: 5, comment: '雇主沟通顺畅，结算及时' },
    create: {
      applicationId: appA.id,
      fromUserId: studentA.id,
      toUserId: employerA.id,
      rating: 5,
      comment: '雇主沟通顺畅，结算及时',
    },
  });
  await prisma.review.upsert({
    where: { applicationId_fromUserId: { applicationId: appA.id, fromUserId: employerA.id } },
    update: { toUserId: studentA.id, rating: 5, comment: '同学认真负责，表现优秀' },
    create: {
      applicationId: appA.id,
      fromUserId: employerA.id,
      toUserId: studentA.id,
      rating: 5,
      comment: '同学认真负责，表现优秀',
    },
  });

  await prisma.jobFavorite.upsert({
    where: { studentId_jobId: { studentId: studentA.id, jobId: jobA.id } },
    update: {},
    create: { studentId: studentA.id, jobId: jobA.id },
  });
  await prisma.jobFavorite.upsert({
    where: { studentId_jobId: { studentId: studentB.id, jobId: jobC.id } },
    update: {},
    create: { studentId: studentB.id, jobId: jobC.id },
  });

  await ensureAnnouncement(admin.id, '[DEMO] 平台使用须知', '请勿私下转账，所有沟通留痕。', true);
  await ensureAnnouncement(
    admin.id,
    '[DEMO] 五一兼职提醒',
    '节假日岗位较多，请及时完善个人资料。',
    false
  );

  const complaint = await prisma.complaint.upsert({
    where: { jobId_studentId: { jobId: jobA.id, studentId: studentB.id } },
    update: {
      type: 'OTHER',
      description: '示例投诉：岗位描述与实际不符',
      status: 'RESOLVED',
      handleNote: '已核实并要求雇主修改信息',
    },
    create: {
      jobId: jobA.id,
      studentId: studentB.id,
      type: 'OTHER',
      description: '示例投诉：岗位描述与实际不符',
      status: 'RESOLVED',
      handleNote: '已核实并要求雇主修改信息',
    },
  });

  const logTemplates = [
    { action: 'APPROVE_JOB', targetId: jobA.id, targetType: 'JOB', note: null },
    { action: 'REJECT_JOB', targetId: jobD.id, targetType: 'JOB', note: '信息不完整' },
    {
      action: 'RESOLVE_COMPLAINT',
      targetId: complaint.id,
      targetType: 'COMPLAINT',
      note: '已处理',
    },
  ];

  for (const row of logTemplates) {
    const exists = await prisma.adminLog.findFirst({
      where: {
        adminId: admin.id,
        action: row.action,
        targetId: row.targetId,
      },
    });
    if (!exists) {
      await prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: row.action,
          targetId: row.targetId,
          targetType: row.targetType,
          note: row.note,
        },
      });
    }
  }

  console.log('Mock data seeded successfully.');
  console.log('Demo users:');
  console.log('- admin / Admin@123456');
  console.log('- demo_employer_1 / Demo@123456');
  console.log('- demo_employer_2 / Demo@123456');
  console.log('- demo_student_1 / Demo@123456');
  console.log('- demo_student_2 / Demo@123456');
  console.log('- demo_student_3 / Demo@123456');
}

main()
  .catch((error) => {
    console.error('Mock seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
