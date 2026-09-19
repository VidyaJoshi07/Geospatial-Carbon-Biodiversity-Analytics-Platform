import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    kwargs: top, bottom, left, right
    values: dict(val='single', sz='4', color='CCCCCC')
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
    for edge, border_args in kwargs.items():
        val = border_args.get('val', 'single')
        sz = border_args.get('sz', '4')
        color = border_args.get('color', 'CCCCCC')
        b_elm = parse_xml(f'<w:{edge} {nsdecls("w")} w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>')
        tcBorders.append(b_elm)
    tcPr.append(tcBorders)

def build_document(output_path):
    doc = docx.Document()

    # Configure Margins (0.8 inches all around)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Base styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x2D, 0x37, 0x48) # Slate 700

    # Palette
    COLOR_PRIMARY = RGBColor(0x05, 0x96, 0x69)   # Emerald 600
    COLOR_SECONDARY = RGBColor(0x0D, 0x94, 0x88) # Teal 600
    COLOR_DARK = RGBColor(0x0F, 0x17, 0x2A)      # Slate 900
    COLOR_MUTED = RGBColor(0x64, 0x74, 0x8B)     # Slate 500

    # -------------------------------------------------------------
    # HEADER / TITLE BLOCK
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("DARUKAA.EARTH: FULL-STACK DEVELOPER HACKATHON")
    title_run.font.name = 'Arial'
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub_p.add_run("Official Project Submission & Technical Implementation Document")
    sub_run.font.name = 'Arial'
    sub_run.font.size = Pt(12)
    sub_run.font.bold = True
    sub_run.font.color.rgb = COLOR_DARK

    meta_p = doc.add_paragraph()
    meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_run = meta_p.add_run("Geospatial Intelligence Platform for Carbon Sequestration & Biodiversity Monitoring\nCandidate: Vidya Joshi  |  GitHub: @VidyaJoshi07")
    meta_run.font.name = 'Calibri'
    meta_run.font.size = Pt(10)
    meta_run.font.color.rgb = COLOR_MUTED

    # Horizontal Rule
    hr_table = doc.add_table(rows=1, cols=1)
    hr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hr_cell = hr_table.cell(0, 0)
    set_cell_background(hr_cell, "059669")
    hr_cell.width = Inches(6.9)
    hr_p = hr_cell.paragraphs[0]
    hr_p.paragraph_format.space_before = Pt(1)
    hr_p.paragraph_format.space_after = Pt(1)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Helper: Section Header
    def add_section_header(num_str, title_str):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        run_num = h.add_run(num_str + " ")
        run_num.font.name = 'Arial'
        run_num.font.size = Pt(13)
        run_num.font.bold = True
        run_num.font.color.rgb = COLOR_PRIMARY

        run_title = h.add_run(title_str)
        run_title.font.name = 'Arial'
        run_title.font.size = Pt(13)
        run_title.font.bold = True
        run_title.font.color.rgb = COLOR_DARK

    # Helper: Subsection Header
    def add_sub_header(title_str):
        sh = doc.add_paragraph()
        sh.paragraph_format.space_before = Pt(10)
        sh.paragraph_format.space_after = Pt(4)
        sh.paragraph_format.keep_with_next = True
        r = sh.add_run(title_str)
        r.font.name = 'Arial'
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = COLOR_SECONDARY

    # Helper: Bullet point
    def add_bullet(bold_prefix, text):
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r1 = bp.add_run(bold_prefix + " ")
        r1.font.bold = True
        r1.font.color.rgb = COLOR_DARK
        r2 = bp.add_run(text)
        r2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # -------------------------------------------------------------
    # 1. GITHUB REPOSITORY LINK & ACCESS INSTRUCTIONS
    # -------------------------------------------------------------
    add_section_header("1.", "GitHub Repository Link & Access Instructions")

    p1 = doc.add_paragraph()
    p1.add_run("The complete full-stack source code, automated test suites, database migration scripts, Docker configs, and CI/CD pipelines have been finalized and pushed to the dedicated repository.")

    # Repository Info Table
    t_repo = doc.add_table(rows=3, cols=2)
    t_repo.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_repo.autofit = False

    headers_repo = [("Item / Parameter", Inches(2.2)), ("Details / URL", Inches(4.7))]
    for j, (hdr, w) in enumerate(headers_repo):
        cell = t_repo.cell(0, j)
        cell.width = w
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 100, 100, 120, 120)
        cp = cell.paragraphs[0]
        r = cp.add_run(hdr)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)

    repo_data = [
        ("Completed Project Repository", "https://github.com/VidyaJoshi07/Geospatial-Carbon-Biodiversity-Analytics-Platform"),
        ("Candidate Profile", "https://github.com/VidyaJoshi07"),
    ]
    for i, (k, v) in enumerate(repo_data, start=1):
        c0 = t_repo.cell(i, 0)
        c1 = t_repo.cell(i, 1)
        c0.width = Inches(2.2)
        c1.width = Inches(4.7)
        bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
        set_cell_background(c0, bg)
        set_cell_background(c1, bg)
        set_cell_margins(c0, 80, 80, 120, 120)
        set_cell_margins(c1, 80, 80, 120, 120)
        border_spec = dict(val='single', sz='4', color='E2E8F0')
        set_cell_border(c0, bottom=border_spec, top=border_spec, left=border_spec, right=border_spec)
        set_cell_border(c1, bottom=border_spec, top=border_spec, left=border_spec, right=border_spec)
        r0 = c0.paragraphs[0].add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r1 = c1.paragraphs[0].add_run(v)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(0x02, 0x84, 0xC7) # Link blue

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    add_sub_header("Repository Access Grants (Private Repository Compliance)")
    p_access = doc.add_paragraph()
    p_access.add_run("In accordance with the hackathon submission instructions, Collaborator / Read & Review permissions have been pre-configured for the Darukaa.Earth hiring and evaluation team:")

    t_eval = doc.add_table(rows=5, cols=3)
    t_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    eval_headers = [("Team Member", Inches(2.2)), ("Evaluation Email", Inches(3.2)), ("Role", Inches(1.5))]
    for j, (hdr, w) in enumerate(eval_headers):
        cell = t_eval.cell(0, j)
        cell.width = w
        set_cell_background(cell, "059669")
        set_cell_margins(cell, 80, 80, 100, 100)
        r = cell.paragraphs[0].add_run(hdr)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)

    eval_members = [
        ("Ankita Dasgupta", "ankita.dasgupta@darukaa.com", "Hiring Evaluator"),
        ("Harsh Kumar", "harsh.kumar@darukaa.com", "Technical Reviewer"),
        ("Utkarsh Gauniyal", "utkarsh.gauniyal@darukaa.com", "Technical Reviewer"),
        ("Guneet Mutreja", "guneet.mutreja@darukaa.com", "Technical Reviewer"),
    ]
    for i, (name, email, role) in enumerate(eval_members, start=1):
        row_bg = "F0FDF4" if i % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate([name, email, role]):
            cell = t_eval.cell(i, col_idx)
            set_cell_background(cell, row_bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            b = dict(val='single', sz='4', color='CBD5E1')
            set_cell_border(cell, bottom=b, top=b, left=b, right=b)
            r = cell.paragraphs[0].add_run(val)
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True

    # -------------------------------------------------------------
    # 2. LIVE DEMO URL & EXECUTION ACCESS
    # -------------------------------------------------------------
    add_section_header("2.", "Live Demo URL & Platform Deployment Details")

    p_demo = doc.add_paragraph()
    p_demo.add_run("The platform is architected for instant, dual-mode evaluation: both via high-availability cloud deployment configurations and local automated execution.")

    t_demo = doc.add_table(rows=4, cols=2)
    t_demo.alignment = WD_TABLE_ALIGNMENT.CENTER
    for j, (hdr, w) in enumerate([("Target Environment", Inches(2.2)), ("Access URL & Verification Endpoint", Inches(4.7))]):
        c = t_demo.cell(0, j)
        c.width = w
        set_cell_background(c, "0F172A")
        set_cell_margins(c, 80, 80, 100, 100)
        r = c.paragraphs[0].add_run(hdr)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)

    demo_rows = [
        ("Frontend Web App (Local)", "http://127.0.0.1:5173/ (Interactive React 18 + MapLibre Web App)"),
        ("Backend REST API & Swagger UI", "http://127.0.0.1:8000/docs (Interactive OpenAPI 3.1 Documentation)"),
        ("API Health Check Endpoint", "http://127.0.0.1:8000/api/health (System status & DB connectivity test)"),
    ]
    for i, (env, url) in enumerate(demo_rows, start=1):
        c0 = t_demo.cell(i, 0)
        c1 = t_demo.cell(i, 1)
        bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
        set_cell_background(c0, bg)
        set_cell_background(c1, bg)
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        b = dict(val='single', sz='4', color='E2E8F0')
        set_cell_border(c0, bottom=b, top=b, left=b, right=b)
        set_cell_border(c1, bottom=b, top=b, left=b, right=b)
        r0 = c0.paragraphs[0].add_run(env)
        r0.font.bold = True
        r0.font.size = Pt(9)
        r1 = c1.paragraphs[0].add_run(url)
        r1.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    p_cloud = doc.add_paragraph()
    p_cloud.add_run("Cloud Deployment Configs: ").font.bold = True
    p_cloud.add_run("The repository includes production infrastructure-as-code manifests: ")
    p_cloud.add_run("render.yaml").font.bold = True
    p_cloud.add_run(" (for Render web service + managed PostgreSQL with PostGIS extension) and ")
    p_cloud.add_run("vercel.json").font.bold = True
    p_cloud.add_run(" (for single-command Vercel Edge CDN frontend hosting with SPA rewrite rules).")

    # -------------------------------------------------------------
    # 3. BRIEF README.md OVERVIEW
    # -------------------------------------------------------------
    add_section_header("3.", "README.md Overview: Architecture, Database Schema, Setup & CI/CD")

    add_sub_header("3.1 High-Level System Architecture")
    p_arch = doc.add_paragraph()
    p_arch.add_run("Darukaa.Earth is designed following an enterprise-grade 4-tier decoupled architecture built for precision geospatial intelligence, longitudinal telemetry, and role-based access:")
    add_bullet("Client Presentation Layer:", "Built with React 18, TypeScript, and Vite. Implements a bespoke dark ecological design system with Tailwind CSS, TanStack Query v5 state caching, Lucide icons, and React Router v6.")
    add_bullet("Geospatial & Mapping Engine:", "Powered by MapLibre GL JS & Mapbox Draw. Operates with high-resolution public ESRI World Imagery satellite tiles, ESRI Dark Gray Canvas, and OpenStreetMap basemaps. Eliminates commercial API key dependencies while rendering real-time PostGIS GeoJSON polygons with geodesic hectare calculations.")
    add_bullet("API Gateway & Application Core:", "Developed in FastAPI (Python 3.12+). Enforces strict Pydantic v2 data validation, standard envelope response structures ({ success, data, error }), JWT authentication (HS256) with refresh token rotation, and RBAC authorization.")
    add_bullet("Geodesic Computation Engine:", "Shapely 2.0 core engine computing Girard's spherical excess theorem over the WGS84 authalic earth radius (R = 6,378,137 m), converting square meters to hectares (1 ha = 10,000 m²) with interior hole subtraction.")
    add_bullet("Persistence & Database Layer:", "SQLAlchemy 2.0 ORM with GeoAlchemy2 and Alembic migrations. Employs PostgreSQL 16 + PostGIS 3.4 for production with SRID 4326 spatial geometry columns and GIST indexing, accompanied by an automatic SQLite local development fallback.")

    add_sub_header("3.2 Relational & Geospatial Database Schema")
    p_db = doc.add_paragraph()
    p_db.add_run("The relational database schema is normalized with strict cascade foreign keys, spatial indices, and automated aggregate rollups across 4 core entities:")

    t_schema = doc.add_table(rows=5, cols=4)
    t_schema.alignment = WD_TABLE_ALIGNMENT.CENTER
    schema_hdrs = [("Entity", Inches(1.3)), ("Primary Attributes", Inches(2.2)), ("Spatial / Technical Features", Inches(1.8)), ("Relationships", Inches(1.6))]
    for j, (hdr, w) in enumerate(schema_hdrs):
        c = t_schema.cell(0, j)
        c.width = w
        set_cell_background(c, "0F172A")
        set_cell_margins(c, 80, 80, 100, 100)
        r = c.paragraphs[0].add_run(hdr)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9)

    schema_rows = [
        ("users", "id, name, email (UK), password_hash, role", "Bcrypt password hashing; Enum ('ADMIN', 'USER')", "1-to-many with projects"),
        ("projects", "id, name, description, project_type, status, total_area, carbon_credits, biodiversity_score", "Types: Carbon, Biodiversity, Mixed; auto-calculated aggregate rollups from sites", "Belongs to user; 1-to-many with sites (cascade delete)"),
        ("sites", "id, project_id, name, description, location, area_hectares, status, carbon_value, biodiversity_value", "location: Geometry('POLYGON', srid=4326); Geodesic authalic area in hectares", "Belongs to project; 1-to-many with site_analytics"),
        ("site_analytics", "id, site_id, recorded_date, carbon_value, biodiversity_value, vegetation_index (NDVI), area_change, performance_score", "Time-series telemetry records; indexed on (site_id, recorded_date) for fast window queries", "Belongs to site (cascade delete)"),
    ]
    for i, (ent, attrs, spat, rels) in enumerate(schema_rows, start=1):
        bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([ent, attrs, spat, rels]):
            c = t_schema.cell(i, col_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 60, 60, 100, 100)
            b = dict(val='single', sz='4', color='E2E8F0')
            set_cell_border(c, bottom=b, top=b, left=b, right=b)
            r = c.paragraphs[0].add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    add_sub_header("3.3 Local Development Setup & Execution")
    p_setup = doc.add_paragraph()
    p_setup.add_run("The repository is engineered for immediate, zero-friction startup on developer machines with both automated 1-click execution scripts and standard CLI commands:")
    add_bullet("One-Click Launcher:", "Double-click start-all.bat (or run start-all.ps1) from the repository root. This immediately launches the FastAPI ASGI server on port 8000, starts the Vite React dev server on port 5173, and launches your browser directly to the dashboard.")
    add_bullet("Manual Backend Setup:", "cd backend && python -m venv venv && venv\\Scripts\\activate && pip install -r requirements.txt && python seed.py && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload")
    add_bullet("Manual Frontend Setup:", "cd frontend && npm install && npm run dev (accessible on http://127.0.0.1:5173)")
    add_bullet("Zero-Dependency Database Execution:", "The backend automatically detects the environment. In production, PostgreSQL + PostGIS is strictly required. For rapid local testing without Docker/virtualization, the database seamlessly initializes local schema tables and automatically seeds complete demo data.")

    add_sub_header("3.4 CI/CD Pipeline & Automated Code Quality")
    p_cicd = doc.add_paragraph()
    p_cicd.add_run("Code reliability, formatting, and security are enforced across every git commit and pull request:")
    add_bullet("GitHub Actions Workflow (.github/workflows/ci.yml):", "Multi-job automated CI pipeline running on ubuntu-latest. Starts a real PostgreSQL 16 + PostGIS 3.4 container service, provisions Python 3.12, runs Astral Ruff linter, executes 15 Pytest unit tests with coverage reporting, verifies Node 20.x, runs TypeScript strict typecheck (tsc --noEmit), ESLint, and completes production bundle compilation (vite build).")
    add_bullet("Pre-Commit Hooks (.pre-commit-config.yaml):", "Enforces automated code quality prior to git commits using pre-commit hooks: whitespace trim, end-of-file fixer, YAML/JSON validation, large file protection, and Ruff automated Python formatting.")
    add_bullet("Automated Test Suite:", "15 comprehensive unit tests (tests/test_auth.py, tests/test_projects.py, tests/test_sites.py, tests/test_analytics.py) covering authentication, role-based authorization, polygon topological validation, GeoJSON geometry normalization, and analytical growth calculations.")

    # -------------------------------------------------------------
    # 4. CREDENTIALS, REVIEW NOTES & AUDIT VERIFICATION
    # -------------------------------------------------------------
    add_section_header("4.", "Credentials, Review Notes & Feature Checklist")

    p_cred = doc.add_paragraph()
    p_cred.add_run("The platform comes pre-populated with realistic, geographically accurate data across 6 global conservation projects, 12 sites with real PostGIS polygon boundaries, and 14 months of historical monthly telemetry:")

    t_cred = doc.add_table(rows=3, cols=4)
    t_cred.alignment = WD_TABLE_ALIGNMENT.CENTER
    cred_hdrs = [("User Role", Inches(1.8)), ("Email Address", Inches(2.2)), ("Password", Inches(1.4)), ("Permission Scope", Inches(1.5))]
    for j, (hdr, w) in enumerate(cred_hdrs):
        c = t_cred.cell(0, j)
        c.width = w
        set_cell_background(c, "059669")
        set_cell_margins(c, 80, 80, 100, 100)
        r = c.paragraphs[0].add_run(hdr)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9)

    cred_rows = [
        ("Administrator (Admin)", "admin@example.com", "Admin@123456", "Full CRUD on Projects, Sites, and Polygon boundaries; GeoJSON import/export"),
        ("Field Researcher (User)", "user@example.com", "User@123456", "Read-only access to Projects, Interactive Map, and Site Time-Series Analytics"),
    ]
    for i, (role, email, pwd, scope) in enumerate(cred_rows, start=1):
        bg = "F0FDF4" if i % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([role, email, pwd, scope]):
            c = t_cred.cell(i, col_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 60, 60, 100, 100)
            b = dict(val='single', sz='4', color='CBD5E1')
            set_cell_border(c, bottom=b, top=b, left=b, right=b)
            r = c.paragraphs[0].add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True

    p_btn = doc.add_paragraph()
    p_btn.paragraph_format.space_before = Pt(4)
    p_btn.add_run("Note: ").font.bold = True
    p_btn.add_run("Quick 1-Click login buttons ('Demo Admin' and 'Demo Researcher') are also available directly on the frontend /login page for zero-keystroke review.")

    add_sub_header("Core Hackathon User Stories - Verification Matrix")

    t_eval_matrix = doc.add_table(rows=5, cols=3)
    t_eval_matrix.alignment = WD_TABLE_ALIGNMENT.CENTER
    matrix_hdrs = [("Hackathon User Story", Inches(2.2)), ("Implemented Feature", Inches(2.5)), ("Verification Status", Inches(2.2))]
    for j, (hdr, w) in enumerate(matrix_hdrs):
        c = t_eval_matrix.cell(0, j)
        c.width = w
        set_cell_background(c, "0F172A")
        set_cell_margins(c, 80, 80, 100, 100)
        r = c.paragraphs[0].add_run(hdr)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9)

    matrix_rows = [
        ("As an admin, create a new project and add multiple geographical sites to it.", "Project creation modal, site creation modal, and interactive polygon boundary drawing tool on map with live area computation in hectares.", "VERIFIED & FUNCTIONAL (6 projects, 12 sites pre-seeded)"),
        ("As an admin, view all projects and sites on an interactive map.", "Global Map view (/map) rendering multi-biome polygon boundaries with color-coding by project type (Carbon: Emerald, Biodiversity: Cyan, Mixed: Blue), popup telemetry cards, and Dark/Satellite/Street switcher.", "VERIFIED & FUNCTIONAL (ESRI Dark & World Imagery Satellite)"),
        ("As an admin, click on a specific site to view detailed analytics and performance over time.", "Dedicated Site Detail page (/sites/:id) and Analytics page (/sites/:id/analytics) with Chart.js time-series plots for Carbon (tCO2e), Biodiversity Index, NDVI Vegetation Index, and Canopy delta % across 7D/30D/3M/6M/1Y/ALL ranges.", "VERIFIED & FUNCTIONAL (14-month telemetry history per site)"),
        ("Automated code quality check & CI/CD pipeline.", "GitHub Actions workflow running Ruff, Pytest with coverage, ESLint, TypeScript compiler, and pre-commit hooks enforcing standards before commit.", "VERIFIED & PASSING (15/15 unit tests, 0 lint errors)"),
    ]
    for i, (story, feat, stat) in enumerate(matrix_rows, start=1):
        bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([story, feat, stat]):
            c = t_eval_matrix.cell(i, col_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 60, 60, 100, 100)
            b = dict(val='single', sz='4', color='E2E8F0')
            set_cell_border(c, bottom=b, top=b, left=b, right=b)
            r = c.paragraphs[0].add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 2:
                r.font.bold = True
                r.font.color.rgb = COLOR_PRIMARY

    # Signature block
    doc.add_paragraph().paragraph_format.space_before = Pt(14)
    sig_p = doc.add_paragraph()
    sig_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    sig_run = sig_p.add_run("Submitted with dedication for the Darukaa.Earth Full-Stack Hackathon Challenge.\nCandidate: Vidya Joshi  |  GitHub: @VidyaJoshi07")
    sig_run.font.size = Pt(9.5)
    sig_run.font.italic = True
    sig_run.font.color.rgb = COLOR_MUTED

    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == '__main__':
    dest1 = r"c:\Users\HP\OneDrive\Desktop\Geospatial Carbon & Biodiversity Analytics Platform\Darukaa_Earth_FullStack_Hackathon_Submission_VidyaJoshi07.docx"
    dest2 = r"C:\Users\HP\Downloads\Darukaa_Earth_FullStack_Hackathon_Submission_VidyaJoshi07.docx"
    build_document(dest1)
    build_document(dest2)
