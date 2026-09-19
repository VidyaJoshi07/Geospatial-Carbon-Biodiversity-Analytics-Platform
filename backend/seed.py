"""
Darukaa.Earth Database Seeder
Populates initial demo data for demonstration purposes:
- 1 Admin: admin@example.com / Admin@123456
- 1 User: user@example.com / User@123456
- 6 Ecological Projects across global biomes
- 12 Sites with real PostGIS polygon boundaries
- 14 months of monthly time series analytics per site
"""

import logging
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, SessionLocal, engine, verify_db_connection
from app.models.project import Project, ProjectStatus, ProjectType
from app.models.site import Site
from app.models.user import User, UserRole
from app.services.analytics_service import AnalyticsService
from app.utils.geo import (
    calculate_polygon_area_hectares,
    validate_and_normalize_geojson_polygon,
)
from app.utils.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("darukaa.seed")


DEMO_POLYGONS = [
    # 1. Amazon Rainforest - Rio Negro Basin (Manaus Region, Brazil)
    {
        "project": "Amazon Rainforest Canopy Protection",
        "site": "Rio Negro Core Reserve",
        "desc": "Primary terra firme canopy monitoring and hyper-diverse canopy preservation.",
        "type": "Polygon",
        "coords": [
            [-60.1245, -2.9812],
            [-60.0821, -2.9812],
            [-60.0821, -3.0245],
            [-60.1245, -3.0245],
            [-60.1245, -2.9812],
        ],
        "carbon": 1420.5,
        "bio": 94.2,
    },
    {
        "project": "Amazon Rainforest Canopy Protection",
        "site": "Jaú River Biodiversity Buffer",
        "desc": "Riparian buffer restoring degraded pasture perimeter and jaguar transit corridor.",
        "type": "Polygon",
        "coords": [
            [-60.1550, -3.0450],
            [-60.1100, -3.0450],
            [-60.1100, -3.0850],
            [-60.1550, -3.0850],
            [-60.1550, -3.0450],
        ],
        "carbon": 980.0,
        "bio": 88.6,
    },

    # 2. Sundarbans Mangrove Blue Carbon Initiative
    {
        "project": "Sundarbans Mangrove Blue Carbon Initiative",
        "site": "Sajnekhali Tidal Mangrove Sector",
        "desc": "Dense Rhizophora mangrove blue-carbon sequestration and cyclone barrier wetland.",
        "type": "Polygon",
        "coords": [
            [88.7520, 22.0520],
            [88.8250, 22.0520],
            [88.8250, 21.9840],
            [88.7520, 21.9840],
            [88.7520, 22.0520],
        ],
        "carbon": 2150.0,
        "bio": 91.5,
    },
    {
        "project": "Sundarbans Mangrove Blue Carbon Initiative",
        "site": "Gosaba Estuarine Restoration Strip",
        "desc": "Community-led Avicennia restoration zone on eroding embankment edges.",
        "type": "Polygon",
        "coords": [
            [88.8400, 22.1200],
            [88.8950, 22.1200],
            [88.8950, 22.0700],
            [88.8400, 22.0700],
            [88.8400, 22.1200],
        ],
        "carbon": 860.2,
        "bio": 82.4,
    },

    # 3. Western Ghats Biodiversity Corridor
    {
        "project": "Western Ghats Biodiversity Corridor Restoration",
        "site": "Wayanad Shola-Grassland High Plateau",
        "desc": "Endemic flora refuge, amphibian sanctuary, and cloud forest cloud-harvesting zone.",
        "type": "Polygon",
        "coords": [
            [76.0120, 11.6420],
            [76.0680, 11.6420],
            [76.0680, 11.5950],
            [76.0120, 11.5950],
            [76.0120, 11.6420],
        ],
        "carbon": 1120.0,
        "bio": 96.8,
    },
    {
        "project": "Western Ghats Biodiversity Corridor Restoration",
        "site": "Nilgiri Foothill Elephant Connectivity Strip",
        "desc": "Critical contiguous wildlife pass mitigating human-elephant conflict.",
        "type": "Polygon",
        "coords": [
            [76.1050, 11.5200],
            [76.1550, 11.5200],
            [76.1550, 11.4700],
            [76.1050, 11.4700],
            [76.1050, 11.5200],
        ],
        "carbon": 740.0,
        "bio": 93.0,
    },

    # 4. Congo Basin Peatland Conservation
    {
        "project": "Congo Basin Peatland Conservation",
        "site": "Likouala Central Peat Dome",
        "desc": "Gigatonne subterranean peat carbon reservoir and swamp forest habitat.",
        "type": "Polygon",
        "coords": [
            [17.4100, 1.1500],
            [17.4800, 1.1500],
            [17.4800, 1.0800],
            [17.4100, 1.0800],
            [17.4100, 1.1500],
        ],
        "carbon": 3400.0,
        "bio": 89.2,
    },
    {
        "project": "Congo Basin Peatland Conservation",
        "site": "Sangha Lowland Canopy Reserve",
        "desc": "Intact western lowland gorilla habitat and ancient hardwood forest tract.",
        "type": "Polygon",
        "coords": [
            [17.3200, 1.0500],
            [17.3900, 1.0500],
            [17.3900, 0.9800],
            [17.3200, 0.9800],
            [17.3200, 1.0500],
        ],
        "carbon": 2800.0,
        "bio": 92.5,
    },

    # 5. Scottish Highlands Rewilding
    {
        "project": "Scottish Highlands Rewilding & Peatland Project",
        "site": "Cairngorms Caledonian Pine Regeneration",
        "desc": "Ancient Caledonian Scots Pine restoration and red squirrel corridor.",
        "type": "Polygon",
        "coords": [
            [-3.8500, 57.1800],
            [-3.7800, 57.1800],
            [-3.7800, 57.1200],
            [-3.8500, 57.1200],
            [-3.8500, 57.1800],
        ],
        "carbon": 620.0,
        "bio": 79.4,
    },
    {
        "project": "Scottish Highlands Rewilding & Peatland Project",
        "site": "Glen Affric Blanket Bog Re-wetting",
        "desc": "Hydrological drain blocking on eroded peat bogs to halt carbon venting.",
        "type": "Polygon",
        "coords": [
            [-4.9500, 57.2800],
            [-4.8800, 57.2800],
            [-4.8800, 57.2200],
            [-4.9500, 57.2200],
            [-4.9500, 57.2800],
        ],
        "carbon": 890.0,
        "bio": 84.1,
    },

    # 6. Borneo Orangutan Peat Swamp Reserve
    {
        "project": "Borneo Orangutan Peat Swamp Reserve",
        "site": "Sebangau River Conservation Zone",
        "desc": "High-density wild Pongo pygmaeus habitat and deep ombrogenous peat dome.",
        "type": "Polygon",
        "coords": [
            [113.8200, -2.3200],
            [113.8900, -2.3200],
            [113.8900, -2.3900],
            [113.8200, -2.3900],
            [113.8200, -2.3200],
        ],
        "carbon": 2950.0,
        "bio": 97.4,
    },
    {
        "project": "Borneo Orangutan Peat Swamp Reserve",
        "site": "Katingan Buffer Restoration Plot",
        "desc": "Native dipterocarp replanting on fire-scarred degraded peat edges.",
        "type": "Polygon",
        "coords": [
            [113.7100, -2.4200],
            [113.7800, -2.4200],
            [113.7800, -2.4900],
            [113.7100, -2.4900],
            [113.7100, -2.4200],
        ],
        "carbon": 1340.0,
        "bio": 88.0,
    },
]


def seed_database():
    logger.info("Verifying database connection before seeding...")
    verify_db_connection()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        logger.info("Seeding Users...")
        # 1. Admin User
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                name="Administrator",
                email="admin@example.com",
                password_hash=hash_password("Admin@123456"),
                role=UserRole.ADMIN,
            )
            db.add(admin_user)
            logger.info("Created demo Admin: admin@example.com / Admin@123456")

        # 2. Regular User
        standard_user = db.query(User).filter(User.email == "user@example.com").first()
        if not standard_user:
            standard_user = User(
                name="Field Researcher",
                email="user@example.com",
                password_hash=hash_password("User@123456"),
                role=UserRole.USER,
            )
            db.add(standard_user)
            logger.info("Created demo User: user@example.com / User@123456")

        db.flush()

        # 3. Seed Projects
        projects_def = [
            {
                "name": "Amazon Rainforest Canopy Protection",
                "desc": "Preserving hyper-diverse primary tropical canopy in the Central Amazon with continuous satellite radar telemetry and acoustic biodiversity monitors.",
                "type": ProjectType.CARBON,
                "status": ProjectStatus.ACTIVE,
            },
            {
                "name": "Sundarbans Mangrove Blue Carbon Initiative",
                "desc": "Estuarine tidal mangrove restoration in the Ganges-Brahmaputra delta, sequestering blue carbon at 4x the rate of terrestrial forests.",
                "type": ProjectType.MIXED,
                "status": ProjectStatus.ACTIVE,
            },
            {
                "name": "Western Ghats Biodiversity Corridor Restoration",
                "desc": "Restoring fragmented wildlife corridors along India's ancient montane escarpment, protecting 325 globally threatened species.",
                "type": ProjectType.BIODIVERSITY,
                "status": ProjectStatus.ACTIVE,
            },
            {
                "name": "Congo Basin Peatland Conservation",
                "desc": "Safeguarding the world's most extensive tropical peatland complex across the Cuvette Centrale basin against commercial encroachment.",
                "type": ProjectType.CARBON,
                "status": ProjectStatus.ACTIVE,
            },
            {
                "name": "Scottish Highlands Rewilding & Peatland Project",
                "desc": "Restoring native Caledonian pine woodlands and re-wetting damaged blanket bogs across the Scottish Highlands to halt carbon venting.",
                "type": ProjectType.MIXED,
                "status": ProjectStatus.COMPLETED,
            },
            {
                "name": "Borneo Orangutan Peat Swamp Reserve",
                "desc": "High-integrity forest conservation habitat for critically endangered Bornean orangutans and peat dome preservation.",
                "type": ProjectType.BIODIVERSITY,
                "status": ProjectStatus.DRAFT,
            },
        ]

        project_map = {}
        for p_data in projects_def:
            p = db.query(Project).filter(Project.name == p_data["name"]).first()
            if not p:
                p = Project(
                    name=p_data["name"],
                    description=p_data["desc"],
                    project_type=p_data["type"],
                    status=p_data["status"],
                    total_area=0.0,
                    carbon_credits=0.0,
                    biodiversity_score=0.0,
                    created_by=admin_user.id,
                )
                db.add(p)
                db.flush()
                logger.info(f"Created project: {p.name}")
            project_map[p.name] = p

        # 4. Seed Sites and Analytics
        for poly_info in DEMO_POLYGONS:
            proj = project_map.get(poly_info["project"])
            if not proj:
                continue

            existing_site = db.query(Site).filter(Site.name == poly_info["site"]).first()
            if not existing_site:
                geom_dict = {
                    "type": "Polygon",
                    "coordinates": [poly_info["coords"]],
                }
                norm_dict, shape_obj = validate_and_normalize_geojson_polygon(geom_dict)
                area_ha = calculate_polygon_area_hectares(norm_dict)

                site = Site(
                    project_id=proj.id,
                    name=poly_info["site"],
                    description=poly_info["desc"],
                    location=shape_obj,
                    area_hectares=area_ha,
                    status="Active",
                    carbon_value=poly_info["carbon"],
                    biodiversity_value=poly_info["bio"],
                )
                db.add(site)
                db.flush()
                logger.info(f"Created site '{site.name}' ({site.area_hectares} ha) in project '{proj.name}'")

                # Generate 14 months of historical analytics
                AnalyticsService.generate_seed_analytics_for_site(db, site, months=14)

        # 5. Recalculate Project Aggregates
        for proj in project_map.values():
            sites = db.query(Site).filter(Site.project_id == proj.id).all()
            if sites:
                proj.total_area = round(sum(s.area_hectares for s in sites), 2)
                proj.carbon_credits = round(sum(s.carbon_value for s in sites), 2)
                proj.biodiversity_score = round(sum(s.biodiversity_value for s in sites) / len(sites), 2)
                db.flush()
                logger.info(f"Updated Project '{proj.name}': {proj.total_area} ha, {proj.carbon_credits} tCO2e, Bio {proj.biodiversity_score}")

        db.commit()
        logger.info("Database seeding completed successfully! Demo credentials ready.")
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
