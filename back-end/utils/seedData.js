require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User    = require('../models/User');
const { calculateReadinessScore, analyzeSkillGap } = require('../controllers/analytics.controller');

const skills    = ['React','Node.js','MongoDB','Python','Java','SQL','AWS','Docker','Git','JavaScript','TypeScript','Django','Flask','Machine Learning','REST API'];
const langs     = ['JavaScript','Python','Java','C++','TypeScript','Go'];
const companies = ['TCS','Infosys','Wipro','Cognizant','Accenture','HCL','Tech Mahindra','Capgemini','IBM','Google','Microsoft','Amazon'];

function rnd(arr)          { return arr[Math.floor(Math.random() * arr.length)] }
function rndInt(min, max)  { return Math.floor(Math.random() * (max - min + 1)) + min }
function rndFloat(min, max){ return parseFloat((Math.random() * (max - min) + min).toFixed(2)) }
function pickN(arr, n)     { return [...arr].sort(() => 0.5 - Math.random()).slice(0, n) }

// Real students data
const realStudents = [
  { enrollment: '0101EX221025', name: 'Gouri Jatav' },
  { enrollment: '0101EX221036', name: 'Mayank Mishra' },
  { enrollment: '0101IT221001', name: 'Aaku Khaped' },
  { enrollment: '0101IT221005', name: 'Aditya Solanki' },
  { enrollment: '0101IT221006', name: 'Akash Singh Bhadauriya' },
  { enrollment: '0101IT221007', name: 'Anil' },
  { enrollment: '0101IT221008', name: 'Ankit Baghel' },
  { enrollment: '0101IT221009', name: 'Anurodh Tiwari' },
  { enrollment: '0101IT221010', name: 'Arjun Singh Khangar' },
  { enrollment: '0101IT221011', name: 'Ayush Ahirwar' },
  { enrollment: '0101IT221012', name: 'Ayush Kumar' },
  { enrollment: '0101IT221013', name: 'Bhanu Pratap Singh' },
  { enrollment: '0101IT221014', name: 'Darshan Misaal' },
  { enrollment: '0101IT221015', name: 'Deepti Deshpande' },
  { enrollment: '0101IT221017', name: 'Dhanraj Kushwaha' },
  { enrollment: '0101IT221018', name: 'Dupali Sharma' },
  { enrollment: '0101IT221019', name: 'Ekta Palohiya' },
  { enrollment: '0101IT221020', name: 'Gavesh Batham' },
  { enrollment: '0101IT221021', name: 'Gourav Sahite' },
  { enrollment: '0101IT221022', name: 'Harish Parley' },
  { enrollment: '0101IT221023', name: 'Harsh Pathak' },
  { enrollment: '0101IT221024', name: 'Harshit Chouhan' },
  { enrollment: '0101IT221025', name: 'Jaydeep Yadav' },
  { enrollment: '0101IT221026', name: 'Kanika Tomer' },
  { enrollment: '0101IT221028', name: 'Kashish Koushal' },
  { enrollment: '0101IT221029', name: 'Kratika Agrawal' },
  { enrollment: '0101IT221030', name: 'Kshitu Indurkar' },
  { enrollment: '0101IT221031', name: 'Kuber Gupta' },
  { enrollment: '0101IT221032', name: 'Lekhraj Prajapati' },
  { enrollment: '0101IT221033', name: 'Mahak Madaria' },
  { enrollment: '0101IT221034', name: 'Manish Kumar Umarvaishy' },
  { enrollment: '0101IT221035', name: 'Mayank Nagle' },
  { enrollment: '0101IT221036', name: 'Mohnishsingh Yadav' },
  { enrollment: '0101IT221037', name: 'Monika Agrawal' },
  { enrollment: '0101IT221038', name: 'Mridul Kalra' },
  { enrollment: '0101IT221039', name: 'Mukesh Kumar Adiwasi' },
  { enrollment: '0101IT221040', name: 'Muskan Dhakariya' },
  { enrollment: '0101IT221041', name: 'Nakul Dubey' },
  { enrollment: '0101IT221042', name: 'Nakul Singh Jadon' },
  { enrollment: '0101IT221044', name: 'Nandni Masram' },
  { enrollment: '0101IT221045', name: 'Naveen Kushwaha' },
  { enrollment: '0101IT221048', name: 'Parineeta Shende' },
  { enrollment: '0101IT221049', name: 'Parth Soni' },
  { enrollment: '0101IT221050', name: 'Pragya Hurmade' },
  { enrollment: '0101IT221051', name: 'Prakhar Sakhare' },
  { enrollment: '0101IT221052', name: 'Prasoon Rahangdale' },
  { enrollment: '0101IT221053', name: 'Pratham Koshta' },
  { enrollment: '0101IT221054', name: 'Priyanshu Somkuwar' },
  { enrollment: '0101IT221055', name: 'Raghav Dixit' },
  { enrollment: '0101IT221056', name: 'Rahul Mishra' },
  { enrollment: '0101IT221057', name: 'Raj Jain' },
  { enrollment: '0101IT221058', name: 'Ravindra Ahirwar' },
  { enrollment: '0101IT221059', name: 'Reshu Gupta' },
  { enrollment: '0101IT221060', name: 'Ritika Raghuwanshi' },
  { enrollment: '0101IT221061', name: 'Satyam Sahu' },
  { enrollment: '0101IT221062', name: 'Shashank Gangoriya' },
  { enrollment: '0101IT221063', name: 'Sheshnarayan Patel' },
  { enrollment: '0101IT221064', name: 'Shivansh Nigam' },
  { enrollment: '0101IT221065', name: 'Sneha Tirole' },
  { enrollment: '0101IT221066', name: 'Sonu Sahu' },
  { enrollment: '0101IT221067', name: 'Suhani Jain' },
  { enrollment: '0101IT221068', name: 'Suhani Sallam' },
  { enrollment: '0101IT221069', name: 'Sunil Kumar Dangi' },
  { enrollment: '0101IT221070', name: 'Syed Rizwan Ali' },
  { enrollment: '0101IT221072', name: 'Vanshika Malviya' },
  { enrollment: '0101IT221073', name: 'Vedank Uikey' },
  { enrollment: '0101IT221074', name: 'Vinay Gharu' },
  { enrollment: '0101IT221076', name: 'Vivekraj Singh Sisodiya' },
  { enrollment: '0101IT221077', name: 'Yash Bhargava' },
  { enrollment: '0101IT221078', name: 'Yash Darbar' },
  { enrollment: '0101IT221079', name: 'Atharv Shrivastav' },
  { enrollment: '0101IT221080', name: 'Ayushi Chandgude' },
  { enrollment: '0101IT221081', name: 'Stuti Savena' },
  { enrollment: '0101IT221082', name: 'Anuj Vishwakarma' },
  { enrollment: '0101IT221083', name: 'Diksha Dwivedi' },
  { enrollment: '0101IT221084', name: 'Divyanshu Kumar Mishra' },
  { enrollment: '0101IT221D04', name: 'Krishna Patidar' },
  { enrollment: '0101IT221D05', name: 'Neha Singh' },
  { enrollment: '0101IT221D06', name: 'Vishnu Bahadur Singh' },
  { enrollment: '0101IT221046', name: 'Pankaj Pandey' },
];

// Generate email from name and enrollment
function makeEmail(name, enrollment) {
  const clean = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${clean}.${enrollment.slice(-4)}@it.edu`;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Student.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared existing data');

  // Admin
  await User.create({ name: 'Admin User', email: 'admin@it.edu', password: 'admin123', role: 'admin' });
  // TPO
  await User.create({ name: 'Rakesh Jain', email: 'tpo@it.edu', password: 'tpo123', role: 'tpo' });

  const students = [];

  for (const s of realStudents) {
    const { enrollment, name } = s;
    const email      = makeEmail(name, enrollment);
    const cgpa       = rndFloat(5.5, 9.8);
    const division   = rnd(['A', 'B', 'C', 'D']);
    const techSkills = pickN(skills, rndInt(2, 6));
    const progLangs  = pickN(langs, rndInt(1, 3));

    const semesterResults = Array.from({ length: 8 }, (_, sem) => ({
      semester: sem + 1,
      sgpa:     rndFloat(5.0, 10.0),
      backlogs: Math.random() < 0.1 ? rndInt(1, 2) : 0
    }));

    const projectsArr = [];
    if (Math.random() > 0.3) {
      projectsArr.push({
        title: `${rnd(['Smart','Cloud','AI','Web','Mobile'])} ${rnd(['System','App','Platform','Dashboard','Portal'])}`,
        type: 'major',
        techStack: pickN(techSkills, Math.min(3, techSkills.length)),
        year: 2024,
        description: 'Final year major project'
      });
    }
    if (Math.random() > 0.4) {
      projectsArr.push({
        title: `${rnd(['Student','Library','Expense','Quiz','Chat'])} ${rnd(['Manager','Tracker','App','System'])}`,
        type: 'minor',
        techStack: pickN(techSkills, 2),
        year: 2023
      });
    }

    const certsArr = [];
    if (Math.random() > 0.5) {
      certsArr.push({
        title: rnd(['AWS Cloud Practitioner','Python for Data Science','Full Stack Web Dev','Java Programming','SQL Basics']),
        issuedBy: rnd(['Coursera','Udemy','NPTEL','AWS','Oracle']),
        issueDate: new Date('2023-06-01')
      });
    }

    const internsArr = [];
    if (Math.random() > 0.45) {
      internsArr.push({
        company:     rnd(companies),
        role:        rnd(['Web Developer Intern','Software Intern','Data Analyst Intern','Backend Intern','ML Intern']),
        startDate:   new Date('2024-05-01'),
        endDate:     new Date('2024-07-31'),
        stipend:     rndInt(5000, 25000),
        isCompleted: true
      });
    }

    const statusRoll = Math.random();
    let placementStatus = 'not_started';
    let placedCompany, placedPackage;
    if (cgpa >= 7.5 && statusRoll > 0.6) {
      placementStatus = 'placed';
      placedCompany   = rnd(companies);
      placedPackage   = rndFloat(4, 18);
    } else if (statusRoll > 0.4) {
      placementStatus = 'in_process';
    } else if (statusRoll < 0.05) {
      placementStatus = 'higher_studies';
    }

    const student = new Student({
      enrollmentNumber: enrollment,
      name,
      email,
      phone: `98${rndInt(10000000, 99999999)}`,
      branch: enrollment.includes('EX') ? 'Electronics' : 'Information Technology',
      division,
      batch: '2022-2026',
      semester: 8,
      cgpa,
      semesterResults,
      totalBacklogs: semesterResults.reduce((s, r) => s + r.backlogs, 0),
      activeBacklogs: 0,
      technicalSkills: techSkills,
      programmingLanguages: progLangs,
      softSkills: pickN(['Communication','Leadership','Teamwork','Problem Solving','Time Management'], rndInt(1, 3)),
      projects: projectsArr,
      certifications: certsArr,
      internships: internsArr,
      achievements: Math.random() > 0.6 ? [rnd(['Won Hackathon 2024','Published Research Paper','Smart India Hackathon Finalist','Best Project Award',"Dean's List"])] : [],
      placementStatus, placedCompany, placedPackage
    });

    student.placementReadinessScore = calculateReadinessScore(student);
    student.skillGaps       = analyzeSkillGap(student);
    student.suggestedSkills = student.skillGaps.slice(0, 3);
    students.push(student);

    await User.create({
      name,
      email,
      password: 'student123',
      role: 'student',
      enrollmentNumber: enrollment
    });
  }

  await Student.insertMany(students);
  console.log(`✅ Seeded ${students.length} real students`);
  console.log(`\nLogin Credentials:`);
  console.log(`  Admin   → admin@it.edu  / admin123`);
  console.log(`  TPO     → tpo@it.edu    / tpo123`);
  console.log(`\nSample Student Logins:`);
  realStudents.slice(0, 5).forEach(s => {
    console.log(`  ${s.enrollment} | ${makeEmail(s.name, s.enrollment)} / student123`);
  });
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });