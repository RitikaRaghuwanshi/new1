const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])
require('dotenv').config()
const mongoose = require('mongoose')
const Faculty  = require('../models/faculty')
const Student  = require('../models/Student')
const User = require('../models/User');
const { calculateReadinessScore, analyzeSkillGap } = require('../controllers/analytics.controller')

const skills    = ['React','Node.js','MongoDB','Python','Java','SQL','AWS','Docker','Git','JavaScript','TypeScript','Django','Flask','Machine Learning','REST API']
const langs     = ['JavaScript','Python','Java','C++','TypeScript','Go']
const companies = ['TCS','Infosys','Wipro','Cognizant','Accenture','HCL','Tech Mahindra','Capgemini','IBM','Google','Microsoft','Amazon']

function rnd(arr)          { return arr[Math.floor(Math.random() * arr.length)] }
function rndInt(min, max)  { return Math.floor(Math.random() * (max - min + 1)) + min }
function rndFloat(min, max){ return parseFloat((Math.random() * (max - min) + min).toFixed(2)) }
function pickN(arr, n)     { return [...arr].sort(() => 0.5 - Math.random()).slice(0, n) }

const realStudents = [
  { enrollment: '0101EX221025', name: 'Gouri Jatav' },
  { enrollment: '0101EX221036', name: 'Mayank Mishra' },
  { enrollment: '01011T221001', name: 'Aaku Khaped' },
  { enrollment: '01011T221005', name: 'Aditya Solanki' },
  { enrollment: '01011T221006', name: 'Akash Singh Bhadauriya' },
  { enrollment: '010117221007', name: 'Anil' },
  { enrollment: '01011T221008', name: 'Ankit Baghel' },
  { enrollment: '0101TT221009', name: 'Anurodh Tiwari' },
  { enrollment: '01011T221010', name: 'Arjun Singh Khangar' },
  { enrollment: '01011T221011', name: 'Ayush Ahirwar' },
  { enrollment: '01011T221012', name: 'Ayush Kumar' },
  { enrollment: '01011T221013', name: 'Bhanu Pratap Singh' },
  { enrollment: '010117221014', name: 'Darshan Misaal' },
  { enrollment: '01011T221015', name: 'Deepti Deshpande' },
  { enrollment: '01011T221017', name: 'Dhanraj Kushwaha' },
  { enrollment: '01011T221018', name: 'Dupali Sharma' },
  { enrollment: '01011T221019', name: 'Ekta Palohiya' },
  { enrollment: '010111221020', name: 'Gavesh Batham' },
  { enrollment: '01011T221021', name: 'Gourav Sahite' },
  { enrollment: '01011T221022', name: 'Harish Parley' },
  { enrollment: '01011T221023', name: 'Harsh Pathak' },
  { enrollment: '01011T221024', name: 'Harshit Chouhan' },
  { enrollment: '01011T221025', name: 'Jaydeep Yadav' },
  { enrollment: '0101TT221026', name: 'Kanika Tomer' },
  { enrollment: '01011T221028', name: 'Kashish Koushal' },
  { enrollment: '01011T221029', name: 'Kratika Agrawal' },
  { enrollment: '01011T221030', name: 'Kshitu Indurkar' },
  { enrollment: '01011T221031', name: 'Kuber Gupta' },
  { enrollment: '0101T221032',  name: 'Lekhráj Prajapati' },
  { enrollment: '0101TT221033', name: 'Mahak Madaria' },
  { enrollment: '010117221034', name: 'Manish Kumar Umarvaishy' },
  { enrollment: '010117221035', name: 'Mayank Nagle' },
  { enrollment: '01011T221036', name: 'Mohnishsingh Yadav' },
  { enrollment: '01011T221037', name: 'Monika Agrawal' },
  { enrollment: '01011T221038', name: 'Mridul Kalra' },
  { enrollment: '01011T221039', name: 'Mukesh Kumar Adiwasi' },
  { enrollment: '0101TT221040', name: 'Muskan Dhakariya' },
  { enrollment: '01011T221041', name: 'Nakul Dubey' },
  { enrollment: '01011T221042', name: 'Nakul Singh Jadon' },
  { enrollment: '01011T221044', name: 'Nandni Masram' },
  { enrollment: '010111221045', name: 'Naveen Kushwaha' },
  { enrollment: '010117221046', name: 'Pankaj Pandey' },
  { enrollment: '010117221048', name: 'Parineeta Shende' },
  { enrollment: '010117221049', name: 'Parth Soni' },
  { enrollment: '010117221050', name: 'Pragya Hurmade' },
  { enrollment: '010117221051', name: 'Prakhar Sakhare' },
  { enrollment: '01011T221052', name: 'Prasoon Rahangdale' },
  { enrollment: '010117221053', name: 'Pratham Koshta' },
  { enrollment: '01011T221054', name: 'Priyanshu Somkuwar' },
  { enrollment: '01011T221055', name: 'Raghav Dixit' },
  { enrollment: '01011T221056', name: 'Rahul Mishra' },
  { enrollment: '010117221057', name: 'Raj Jain' },
  { enrollment: '01011T221058', name: 'Ravindra Ahirwar' },
  { enrollment: '010117221059', name: 'Reshu Gupta' },
  { enrollment: '0101TT221060', name: 'Ritika Raghuwanshi' },
  { enrollment: '01011T221061', name: 'Satyam Sahu' },
  { enrollment: '010117221062', name: 'Shashank Gangoriya' },
  { enrollment: '01011T221063', name: 'Sheshnarayan Patel' },
  { enrollment: '0101IT221064', name: 'Shivansh Nigam' },
  { enrollment: '01011T221065', name: 'Sneha Tirole' },
  { enrollment: '01011T221066', name: 'Sonu Sahu' },
  { enrollment: '01011T221067', name: 'Suhani Jain' },
  { enrollment: '01011T221068', name: 'Suhani Sallam' },
  { enrollment: '01011T221069', name: 'Sunil Kumar Dangi' },
  { enrollment: '01011T221070', name: 'Syed Rizwan Ali' },
  { enrollment: '01011T221072', name: 'Vanshika Malviya' },
  { enrollment: '010117221073', name: 'Vedank Uikey' },
  { enrollment: '010117221074', name: 'Vinay Gharu' },
  { enrollment: '010117221076', name: 'Vivekraj Singh Sisodiya' },
  { enrollment: '010117221077', name: 'Yash Bhargava' },
  { enrollment: '01011T221078', name: 'Yash Darbar' },
  { enrollment: '01011T221079', name: 'Atharv Shrivastav' },
  { enrollment: '0101TT221080', name: 'Ayushi Chandgude' },
  { enrollment: '0101IT221081', name: 'Stuti Saxena' },
  { enrollment: '01011T233D01', name: 'Anuj Vishwakarma' },
  { enrollment: '01011T233D02', name: 'Diksha Dwivedi' },
  { enrollment: '01011T233D03', name: 'Divyanshu Kumar Mishra' },
  { enrollment: '01011T233D04', name: 'Krishna Patidar' },
  { enrollment: '01011T233D05', name: 'Neha Singh' },
  { enrollment: '01011T233D06', name: 'Vishnu Bahadur Singh' }
]


function makeEmail(name, enrollment) {
  const clean = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')
  return `${clean}.${enrollment.slice(-4)}@it.edu`
}

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/acadplace'
  await mongoose.connect(uri)
  console.log('✅ Connected to MongoDB')

  await Student.deleteMany({})
  await User.deleteMany({})
  await Faculty.deleteMany({})
  console.log('🗑  Cleared existing data')

  // Seed admin and TPO
  await User.create({ name: 'Admin User',    email: 'admin@it.edu', password: 'admin123', role: 'admin' })
  await User.create({ name: 'Rakesh Jain', email: 'tpo@it.edu', password: 'tpo123',   role: 'tpo'   })
  console.log('✅ Admin and TPO created')

  // Seed faculty
  const facultyData = [
    { facultyId: 'FAC001', name: 'Dr. Roopam Gupta', email: 'roopam@it.edu',        password: 'roopam123', subject: 'Advanced Computer Networks', subjectCode: 'ACN701' },
    { facultyId: 'FAC002', name: 'Anjana Pandey',    email: 'anjana.pandey@it.edu',  password: 'anjana123', subject: 'Blockchain Technology',       subjectCode: 'BCT702' },
    { facultyId: 'FAC003', name: 'Anjana Patney',    email: 'anjana.patney@it.edu',  password: 'patney123', subject: 'Information Security',        subjectCode: 'ISC703' },
  ]
  for (const f of facultyData) {
    await Faculty.create(f)
  }
  console.log('✅ Faculty seeded (passwords hashed by pre-save hook)')

  const students = []
  for (const s of realStudents) {
    const { enrollment, name } = s
    const email      = makeEmail(name, enrollment)
    const cgpa       = rndFloat(5.5, 9.8)
    const division   = rnd(['A', 'B', 'C', 'D'])
    const techSkills = pickN(skills, rndInt(2, 6))
    const progLangs  = pickN(langs, rndInt(1, 3))

    const semesterResults = Array.from({ length: 8 }, (_, sem) => ({
      semester: sem + 1,
      sgpa:     rndFloat(5.0, 10.0),
      backlogs: Math.random() < 0.1 ? rndInt(1, 2) : 0
    }))

    const projectsArr = []
    if (Math.random() > 0.3) {
      projectsArr.push({
        title:       `${rnd(['Smart','Cloud','AI','Web','Mobile'])} ${rnd(['System','App','Platform','Dashboard','Portal'])}`,
        type:        'major',
        techStack:   pickN(techSkills, Math.min(3, techSkills.length)),
        year:        2024,
        description: 'Final year major project'
      })
    }
    if (Math.random() > 0.4) {
      projectsArr.push({
        title:    `${rnd(['Student','Library','Expense','Quiz','Chat'])} ${rnd(['Manager','Tracker','App','System'])}`,
        type:     'minor',
        techStack: pickN(techSkills, 2),
        year:     2023
      })
    }

    const certsArr = []
    if (Math.random() > 0.5) {
      certsArr.push({
        title:     rnd(['AWS Cloud Practitioner','Python for Data Science','Full Stack Web Dev','Java Programming','SQL Basics']),
        issuedBy:  rnd(['Coursera','Udemy','NPTEL','AWS','Oracle']),
        issueDate: '2023-06-01'
      })
    }

    const internsArr = []
    if (Math.random() > 0.45) {
      internsArr.push({
        company:     rnd(companies),
        role:        rnd(['Web Developer Intern','Software Intern','Data Analyst Intern','Backend Intern','ML Intern']),
        startDate:   '2024-05-01',
        endDate:     '2024-07-31',
        stipend:     rndInt(5000, 25000),
        isCompleted: true
      })
    }

    const statusRoll = Math.random()
    let placementStatus = 'not_started'
    let placedCompany, placedPackage
    if (cgpa >= 7.5 && statusRoll > 0.6) {
      placementStatus = 'placed'
      placedCompany   = rnd(companies)
      placedPackage   = rndFloat(4, 18)
    } else if (statusRoll > 0.4) {
      placementStatus = 'in_process'
    } else if (statusRoll < 0.05) {
      placementStatus = 'higher_studies'
    }

    const student = new Student({
      enrollmentNumber:     enrollment,
      name,
      email,
      phone:                `98${rndInt(10000000, 99999999)}`,
      branch:               'Information Technology',
      division,
      batch:                '2022-2026',
      semester:             8,
      cgpa,
      semesterResults,
      totalBacklogs:        semesterResults.reduce((s, r) => s + r.backlogs, 0),
      activeBacklogs:       0,
      technicalSkills:      techSkills,
      programmingLanguages: progLangs,
      softSkills:           pickN(['Communication','Leadership','Teamwork','Problem Solving','Time Management'], rndInt(1, 3)),
      projects:             projectsArr,
      certifications:       certsArr,
      internships:          internsArr,
      achievements:         Math.random() > 0.6 ? [rnd(['Won Hackathon 2024','Published Research Paper','Smart India Hackathon Finalist','Best Project Award'])] : [],
      placementStatus,
      placedCompany,
      placedPackage
    })

    student.placementReadinessScore = calculateReadinessScore(student)
    student.skillGaps               = analyzeSkillGap(student)
    student.suggestedSkills         = student.skillGaps.slice(0, 3)
    students.push(student)

    const newUser = new User({ name, email, password: 'student123', role: 'student', enrollmentNumber: enrollment })
    await newUser.save()
  }

  await Student.insertMany(students)
  console.log(`✅ Seeded ${students.length} students`)
  console.log('\n📋 Login Credentials:')
  console.log('  Admin   → admin@it.edu       / admin123')
  console.log('  TPO     → tpo@it.edu         / tpo123')
  console.log('  Faculty → roopam@it.edu      / roopam123')
  console.log('  Faculty → anjana.pandey@it.edu / anjana123')
  console.log('  Student → (email from above)  / student123')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1) })