-- =============================================
-- 1. DATABASE ARCHITECTURE
-- =============================================
CREATE DATABASE IF NOT EXISTS shs;
USE shs;

-- Clear existing tables to ensure a fresh start (Optional)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs, exam_results, projects, issuances, inventory, categories, admins;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 2. CORE INFRASTRUCTURE TABLES
-- =============================================

-- Administrative Personnel
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('SuperAdmin', 'Editor', 'Viewer') DEFAULT 'Editor',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Document Classification
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    prefix VARCHAR(10),
    description TEXT
) ENGINE=InnoDB;

-- Students table for SHS Management Module
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    strand VARCHAR(100),
    section VARCHAR(100),
    school_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Results table (exam or assessment results)
CREATE TABLE IF NOT EXISTS results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    remarks VARCHAR(255),
    exam_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Files table to store upload metadata
CREATE TABLE IF NOT EXISTS files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    originalname VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 3. CONTENT & TRACKING TABLES
-- =============================================

-- Official Issuances (The heart of the portal)
CREATE TABLE issuances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    doc_number VARCHAR(50) NOT NULL,
    series_year INT NOT NULL,
    title TEXT NOT NULL,
    date_issued DATE,
    signatory VARCHAR(150), -- Who signed the document
    file_path VARCHAR(255) DEFAULT 'default.pdf',
    tags VARCHAR(255), -- For better search (e.g., 'Curriculum, Science, Grade 11')
    view_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- SHS Projects & Learning Materials
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) UNIQUE,
    project_title VARCHAR(255) NOT NULL,
    summary TEXT,
    budget_allocation DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('Proposed', 'Planning', 'Ongoing', 'Quality Assured', 'Completed', 'Cancelled') DEFAULT 'Planning',
    material_type VARCHAR(50), -- SLM, LAS, Video Lesson, Exam
    start_date DATE,
    end_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Exam Analytics & Assessment Results
CREATE TABLE exam_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    exam_title VARCHAR(255) NOT NULL,
    school_year VARCHAR(20), -- e.g., '2025-2026'
    total_examinees INT DEFAULT 0,
    passing_rate DECIMAL(5,2), -- e.g., 85.50
    mean_score DECIMAL(5,2),
    highest_score INT,
    lowest_score INT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Physical Resource Inventory
CREATE TABLE inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_code VARCHAR(50) UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    category ENUM('Office Supplies', 'IT Equipment', 'Learning Kits', 'Furniture') DEFAULT 'Office Supplies',
    unit VARCHAR(50), -- reams, pcs, units
    quantity INT DEFAULT 0,
    critical_level INT DEFAULT 5, -- Alert when stock is below this
    location VARCHAR(100),
    remarks TEXT
) ENGINE=InnoDB;

-- =============================================
-- 4. SYSTEM INTELLIGENCE TABLES
-- =============================================

-- Audit Logs (Security feature: Tracks who did what)
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT,
    action VARCHAR(255), -- e.g., 'Updated Project SHS-CORE'
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- 5. MASSIVE SEED DATA (2026 CONTEXT)
-- =============================================

-- Categories
INSERT INTO categories (name, prefix, description) VALUES 
('Division Memoranda', 'DM', 'Official communications from the Schools Division Office'),
('Regional Memoranda', 'RM', 'Communications from the Regional Office'),
('Advisory', 'ADV', 'Announcements for information of the field'),
('Policy', 'POL', 'Permanent guidelines and institutional rules'),
('Office Order', 'OO', 'Internal personnel directives');

-- Admins (Password: password123)
INSERT INTO admins (username, password, full_name, role) VALUES 
('admin_main', '$2a$10$6p9GzC9Fp/zQvLp/M1H8/.fW.V5A7r6QhO6vL/y7z5e5z5z5z5z5z', 'Dr. Maria Dela Cruz', 'SuperAdmin'),
('editor_shs', '$2a$10$6p9GzC9Fp/zQvLp/M1H8/.fW.V5A7r6QhO6vL/y7z5e5z5z5z5z5z', 'Juan Luna', 'Editor');

-- Issuances (Simulating 2026 Records)
INSERT INTO issuances (category_id, doc_number, series_year, title, date_issued, signatory) VALUES 
(1, '106', 2026, 'Quality Assurance for Senior High School Specialized Subject Modules', '2026-03-01', 'Division Superintendent'),
(1, '107', 2026, 'Administration of National Achievement Test (NAT) for Grade 12', '2026-03-05', 'CID Chief'),
(2, '045', 2026, 'Regional Festival of Talents - SHS Category Guidelines', '2026-02-15', 'Regional Director'),
(3, '012', 2026, 'Postponement of SHS Work Immersion Orientation', '2026-03-10', 'SHS Coordinator'),
(4, '002', 2026, 'Revised Policy on Classroom Observation for SHS Teachers', '2026-01-20', 'Secretary of Education');

-- Projects (Status and Summary)
INSERT INTO projects (project_code, project_title, summary, status, material_type, start_date) VALUES 
('SHS-CORE-2026', 'Project CORE: Contextualized Online Resource Essentials', 'Comprehensive development of digitized SLMs for core subjects in Grade 11.', 'Quality Assured', 'Digitized SLM', '2026-01-15'),
('SHS-TVL-RETOOL', 'TVL Teacher Retooling Phase 2', 'Skills upgrade for TVL teachers focusing on modern robotics and automation.', 'Ongoing', 'Training Manual', '2026-02-01'),
('EXAM-BANK-V3', 'Division Unified Test Item Bank', 'A centralized database of validated exam questions for all SHS strands.', 'Planning', 'Exam Bank', '2026-03-12');

-- Exam Results
INSERT INTO exam_results (project_id, exam_title, school_year, total_examinees, passing_rate, mean_score) VALUES 
(1, 'Midterm Assessment - Oral Comm', '2025-2026', 2450, 89.20, 84.50),
(1, 'Midterm Assessment - General Math', '2025-2026', 2450, 76.45, 72.10),
(2, 'Pre-Competency Test (Robotics)', '2025-2026', 120, 95.00, 91.00);

-- Inventory
INSERT INTO inventory (item_code, item_name, category, unit, quantity, location) VALUES 
('SUP-001', 'A4 Bond Paper (80gsm)', 'Office Supplies', 'Reams', 250, 'Cabinet A'),
('IT-005', 'Wireless Presenter / Laser Pointer', 'IT Equipment', 'Pcs', 15, 'Tech Room'),
('KIT-SHS-01', 'Senior High Science Lab Kits', 'Learning Kits', 'Units', 40, 'Science Lab Storage');