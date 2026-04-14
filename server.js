const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db');
const axios = require("axios");

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const session = require('express-session');

app.use(session({
  secret: 'placement-secret-key', // you can write any secret key
  resave: false,
  saveUninitialized: true,
}));
function isAdmin(req, res, next) {
  if (req.session.role === 'admin') {
    next();
  } else {
    res.status(403).send('Access denied. Admins only.');
  }};






app.get('/', (req, res) => {
  res.render('index');
});



// Register
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
console.log("BODY RECEIVED:", req.body);
  const {name, email, roll_no, password,
      branch, cgpa, skills,
      age, backlogs, internships, certifications,
      coding_skills, communication_skills,
      aptitude_score, projects,
      gender, degree} = req.body;

   const sql= `INSERT INTO students (name, email, roll_no,password, branch, cgpa,skills, age, backlogs, internships, certifications, coding_skills, communication_skills, aptitude_score, projects, gender, degree) VALUES (?, ?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
     db.query(sql, [name, email, roll_no, password, branch, cgpa, skills, age, backlogs, internships, certifications, coding_skills, communication_skills, aptitude_score, projects, gender, degree],async(err)=>{
      if(err){
        console.log("db ERROR:", err);
        return res.send('Error during DB');
     }
   
     try{
        // 2️⃣ Build ML features
    const features = [
      Number(age),
      Number(cgpa),
      Number(backlogs),
      Number(internships),
      Number(certifications),
      Number(coding_skills),
      Number(communication_skills),
      Number(aptitude_score),
      Number(projects),

      gender === "Female" ? 1 : 0,
      gender === "Male" ? 1 : 0,

      degree === "BCA" ? 1 : 0,
      degree === "BE" ? 1 : 0,
      degree === "BSc" ? 1 : 0,
      degree === "BTech" ? 1 : 0,

      // branch encoding (FINAL CORRECT 🔥)
  branch === "AI" ? 1 : 0,
  branch === "CS" ? 1 : 0,
  branch === "DS" ? 1 : 0,
  branch === "Electrical" ? 1 : 0,
  branch === "IT" ? 1 : 0,
  branch === "Mechanical" ? 1 : 0
  
    ];

    // 3️⃣ Call FastAPI ML model
    const mlResponse = await axios.post(
      "http://127.0.0.1:8000/predict",
      { features }
    );

    const prediction = mlResponse.data.prediction[0];

    console.log("ML Prediction:", prediction);
     // 4️⃣ Update DB with prediction
    const updateSql = `
      UPDATE students 
      SET prediction = ?
      WHERE email = ?
    `;

    db.query(updateSql, [prediction, email]);


  
      res.redirect('/login');
    }
  catch(error){
    console.log("ml error:", error);
    res.send('Error during ML prediction');
  }
     });
    });

// Login
app.get('/login', (req, res) => {
  res.render('login');
});





app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM students WHERE email=? AND password=?',
    [email, password],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send('Error during login');
      }

      if (results.length > 0) {
        //  Store student info in session
        req.session.student_id = results[0].id;
        req.session.student_name = results[0].name;
           req.session.role = results[0].role;

        console.log("Logged in as:", req.session.student_id, req.session.student_name);

        res.redirect('/dashboard');
      } else {
        res.send('Invalid Credentials');
      }
    }
  );
});


// Dashboard
app.get('/dashboard', (req, res) => {
    const query = `
    SELECT c.id, c.name, c.job_role, c.package, c.eligibility_cgpa, 
           COUNT(a.id) AS total_applicants
    FROM companies c
    LEFT JOIN applications a ON c.id = a.company_id
    GROUP BY c.id, c.name, c.job_role, c.package, c.eligibility_cgpa
    ORDER BY c.name;
  `;

  db.query(query, (err, companies) => {
    if (err) return res.send('Error loading jobs');
    res.render('dashboard', { companies,
      user:{role:req.session.role}
    });
  });
});
// Add new company opening (GET)
 app.get('/add-company',isAdmin, (req, res) => {
  
   
   res.render('addCompany',{title:'Add Company',companies: []});
});

// Add new company opening (POST)
app.post('/add-company',  isAdmin,(req, res) => {
  const { name, job_role, eligibility_cgpa, package, description } = req.body;
  const query = 'INSERT INTO companies (name, job_role, eligibility_cgpa, package, description) VALUES (?, ?, ?, ?, ?)';
  
  db.query(query, [name, job_role, eligibility_cgpa, package, description], (err) => {
    if (err) {
      console.error(err);
      res.send('Error adding company');
    } else {
      console.log(' New company added');
      res.redirect('/dashboard');
    }
  });
});


// Apply
// Show company application form
app.get('/apply/:companyId', (req, res) => {
  const { companyId } = req.params;

  db.query('SELECT * FROM companies WHERE id = ?', [companyId], (err, results) => {
    if (err || results.length === 0) return res.send('Company not found');
    const company = results[0];
    res.render('apply', { company });
  });
});

app.post('/apply/:companyId', (req, res) => {
  const student_id = req.session.student_id; // static for demo
  const company_id = req.params.companyId;
  const{ roll_no,skills}=req.body;
  db.query(
    'INSERT INTO applications (student_id, company_id) VALUES (?, ?)',
    [student_id, company_id],
    (err) => {
      if (err) return res.send('Error applying for job');
      res.send(`<h3>Application subbmitted succesfullyfor Company ID ${company_id}</h3><a href="/my-applications">Go Back</a>`);

    }
  );
});
// My Applications - View all jobs applied by a student
app.get('/my-applications', (req, res) => {
  const student_id =req.session.student_id ; // for now, static (you can later use session-based login)
  if (!student_id) {
    return res.send('Please log in first to view your applications.');
  }
  const sql = `
    SELECT companies.name, companies.job_role, companies.package, companies.eligibility_cgpa
    FROM applications
    JOIN companies ON applications.company_id = companies.id
    WHERE applications.student_id = ?
  `;

  db.query(sql, [student_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.send('Error loading your applications');
    }
    res.render('myApplications', { applications: results });
  });
});
// Admin - View all applications with student + company info
app.get('/admin/applications',isAdmin, (req, res) => {
  const sql = `
        SELECT 
      c.id AS company_id,
      c.name AS company_name,
      c.job_role,
      c.eligibility_cgpa AS eligibility,
      c.package,
      COUNT(a.id) AS total_applicants
    FROM companies c
    LEFT JOIN applications a ON c.id = a.company_id
    GROUP BY c.id, c.name, c.job_role, c.eligibility_cgpa, c.package
    ORDER BY c.name;

  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.send('Error loading all applications');
    }
    res.render('adminApplications', { applications: results });
  });
});


app.listen(5000, () => console.log('Server running on http://localhost:5000'));
