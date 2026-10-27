require('dotenv').config();
const express=require('express'),session=require('express-session'),PgSession=require('connect-pg-simple')(session),helmet=require('helmet'),path=require('node:path'),{pool,initializeDatabase}=require('./db');
const app=express(),production=process.env.NODE_ENV==='production';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error('SESSION_SECRET must be at least 32 characters.');
if(production)app.set('trust proxy',1);
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],fontSrc:["'self'",'https://fonts.gstatic.com']}}}));
app.use(express.json({limit:'10kb'}));
app.use(session({name:'rasoi.sid',store:new PgSession({pool,tableName:'user_sessions',createTableIfMissing:true}),secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:production,maxAge:24*60*60*1000}}));
app.get('/health',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({status:'ok'});}catch(_err){res.status(503).json({status:'unavailable'});}});
app.use('/api/auth',require('./routes/auth'));
app.get('/api/dashboard',(req,res)=>req.session.user?res.json({user:req.session.user}):res.status(401).json({error:'Please log in.'}));
app.get('/dashboard.html',(req,res)=>{if(!req.session.user)return res.redirect('/');res.set('Cache-Control','no-store');return res.sendFile(path.join(__dirname,'..','public','dashboard.html'));});
app.use(express.static(path.join(__dirname,'..','public')));
app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));
const port=Number(process.env.PORT||3000);
initializeDatabase().then(()=>app.listen(port,()=>console.log(`RASOI listening on ${port}`))).catch(err=>{console.error('Database initialization failed:',err.message);process.exit(1)});

