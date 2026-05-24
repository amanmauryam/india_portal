import asyncio
import uuid
from app.database import Base, engine, async_session
from app.auth import get_password_hash
from app.models import User, State, District, Service, BlogPost

async def seed_data():
    print("Initializing database tables...")
    async with engine.begin() as conn:
        # Drop all tables first for absolute model consistency in local dev
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database tables initialized.")
    
    async with async_session() as session:
        # Check if users already exist to prevent duplicate seeding
        from sqlalchemy.future import select
        res = await session.execute(select(User).limit(1))
        if res.scalars().first():
            print("Database already seeded. Skipping...")
            return

        print("Seeding Users...")
        # 1. Users
        super_admin = User(
            email="admin@portal.gov.in",
            hashed_password=get_password_hash("adminpassword123"),
            full_name="Super Admin Kashi",
            role="SUPER_ADMIN",
            is_active=True
        )
        state_manager = User(
            email="manager@portal.gov.in",
            hashed_password=get_password_hash("managerpassword123"),
            full_name="Uttar Pradesh Manager",
            role="STATE_MANAGER",
            is_active=True
        )
        district_editor = User(
            email="editor@portal.gov.in",
            hashed_password=get_password_hash("editorpassword123"),
            full_name="Varanasi District Editor",
            role="DISTRICT_EDITOR",
            is_active=True
        )
        session.add_all([super_admin, state_manager, district_editor])
        await session.flush()  # Populates IDs

        print("Seeding States...")
        # 2. States
        up = State(
            name="Uttar Pradesh",
            slug="uttar-pradesh",
            description="India's most populous state, rich in cultural heritage, agriculture, and spirituality."
        )
        karnataka = State(
            name="Karnataka",
            slug="karnataka",
            description="A hub of technology and industry in South India, renowned for its heritage and beautiful scenery."
        )
        maharashtra = State(
            name="Maharashtra",
            slug="maharashtra",
            description="The economic powerhouse of India, home to bustling financial centers and rich historical caves."
        )
        session.add_all([up, karnataka, maharashtra])
        await session.flush()

        print("Seeding Districts...")
        # 3. Districts
        varanasi = District(
            state_id=up.id,
            name="Varanasi",
            slug="varanasi",
            overview="Varanasi, also known as Banaras or Kashi, is one of the oldest continuously inhabited cities in the world. It is the spiritual heart of India, located on the sacred banks of the River Ganges.",
            famous_places=[
                {"name": "Kashi Vishwanath Temple", "description": "The famous Hindu temple dedicated to Lord Shiva, recently renovated with a magnificent corridor."},
                {"name": "Dashashwamedh Ghat", "description": "The main and most spectacular ghat on the Ganges, famous for the daily grand Ganga Aarti."},
                {"name": "Sarnath", "description": "Located 10 km from Varanasi, this is the deer park where Gautama Buddha first taught the Dharma."}
            ],
            railway_stations=[
                "Varanasi Junction (BSB)",
                "Banaras Railway Station (BSBS)",
                "Pt. Deen Dayal Upadhyaya Junction (DDU)"
            ],
            industries_overview="Famous for handloom weaving, specifically exquisite Banarasi silk sarees. It is also home to diesel locomotive manufacturing and extensive handicraft cottage industries.",
            odop={
                "product_name": "Banarasi Silk Saree & Wooden Toys",
                "description": "Exquisite silk handlooms woven with intricate gold/silver brocade (Zari) and beautifully hand-crafted lacquered wooden toys.",
                "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"
            },
            emergency_contacts={
                "police": "112 / 0542-2502555",
                "fire": "101 / 0542-2503254",
                "ambulance": "108 / 102",
                "helpline": "181 (Women Helpline)"
            },
            most_searched_queries=[
                "Varanasi Ganga Aarti timings",
                "How to pay Varanasi water bill online",
                "Kashi Vishwanath temple darshan booking",
                "Banarasi silk saree authentication centers"
            ]
        )

        lucknow = District(
            state_id=up.id,
            name="Lucknow",
            slug="lucknow",
            overview="Lucknow, the capital city of Uttar Pradesh, is celebrated for its historic Nawabi culture, polite mannerisms (Tehzeeb), stunning architecture, and legendary Awadhi cuisine.",
            famous_places=[
                {"name": "Bara Imambara", "description": "An architectural marvel featuring the Bhool Bhulaiya, a fascinating labyrinth built in 1784."},
                {"name": "Rumi Darwaza", "description": "An imposing gateway that has become the signature symbol of Lucknow's heritage architecture."},
                {"name": "Hazratganj", "description": "The Victorian-style central shopping district, perfect for evening strolls ('Ganjing')."}
            ],
            railway_stations=[
                "Lucknow Charbagh (LKO)",
                "Lucknow Junction (LJN)"
            ],
            industries_overview="Center for Chikan & Zardozi embroidery, perfume manufacturing, distilleries, and burgeoning IT parks.",
            odop={
                "product_name": "Chikankari & Zardozi Craft",
                "description": "Traditional textile hand embroidery featuring shadow work and delicate floral patterns, recognized worldwide.",
                "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"
            },
            emergency_contacts={
                "police": "112 / 0522-2200330",
                "fire": "101 / 0522-2615656",
                "ambulance": "108",
                "helpline": "1090 (Women Power Line)"
            },
            most_searched_queries=[
                "Lucknow municipal corporation house tax",
                "Bara Imambara entry ticket price",
                "Best Chikankari shops in Aminabad",
                "Lucknow Metro route map"
            ]
        )

        bengaluru = District(
            state_id=karnataka.id,
            name="Bengaluru",
            slug="bengaluru",
            overview="Bengaluru (formerly Bangalore) is the capital of Karnataka. Globally recognized as the 'Silicon Valley of India', it is a vibrant cosmopolitan metropolis known for its parks, mild climate, and booming technology sector.",
            famous_places=[
                {"name": "Lalbagh Botanical Garden", "description": "A historic 240-acre garden housing India's largest collection of tropical plants and a glass house modeled on London's Crystal Palace."},
                {"name": "Bangalore Palace", "description": "A majestic royal palace built in the Tudor Revival style, featuring wood carvings and historical photos."},
                {"name": "Visvesvaraya Museum", "description": "A fascinating interactive science museum popular among students and technology enthusiasts."}
            ],
            railway_stations=[
                "KSR Bengaluru City (SBC)",
                "Yesvantpur Junction (YPR)",
                "Krishnarajapuram (KJM)"
            ],
            industries_overview="The absolute hub of information technology, biotechnology, aerospace, heavy machinery manufacturing (HAL, BEL), and premium startup incubators.",
            odop={
                "product_name": "Channapatna Toys & Bangalore Silk",
                "description": "Lacquered wooden toys made in the nearby district of Ramanagara, along with high-luster mulberry silk fabrics.",
                "image_url": "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&auto=format&fit=crop&q=80"
            },
            emergency_contacts={
                "police": "112 / 080-22942222",
                "fire": "101 / 080-22971500",
                "ambulance": "108 / 104",
                "helpline": "1098 (Child Helpline)"
            },
            most_searched_queries=[
                "BESCOM electricity bill download",
                "Namma Metro route map and timings",
                "BWSSB water connection application status",
                "One Bengaluru portal services guide"
            ]
        )
        session.add_all([varanasi, lucknow, bengaluru])
        await session.flush()

        print("Seeding Services...")
        # 4. Services
        varanasi_elec = Service(
            district_id=varanasi.id,
            name="UPPCL Electricity Bill Payment",
            slug="uppcl-electricity-bill",
            category="ELECTRICITY",
            official_link="https://www.uppclonline.com/",
            step_by_step_guide=[
                "Go to the official UPPCL portal at https://www.uppclonline.com/",
                "Click on 'Pay Bill Online' on the homepage.",
                "Select your zone (Urban or Rural).",
                "Enter your 10-digit or 12-digit Account Number from your physical bill.",
                "Verify the consumer details, bill amount, and due date displayed.",
                "Select a payment method (Netbanking, Credit/Debit card, UPI, or Wallet).",
                "Complete the OTP transaction and save the receipt PDF."
            ],
            faqs=[
                {"question": "What is the difference between rural and urban bills in UP?", "answer": "Rural consumers have 12-digit account numbers and belong to Purvanchal Vidyut Vitran, while Urban consumers have 10-digit account numbers with distinct slab tariffs."},
                {"question": "How can I update my mobile number in UPPCL?", "answer": "You can login to the UPPCL portal, navigate to 'Manage Profile', and trigger an OTP to update your registered mobile number."}
            ],
            warning_notes="WARNING: Be extremely cautious of fake SMS alerts stating that your electricity connection will be disconnected by 9:30 PM. UPPCL never sends direct personal numbers for bills. Always check the official website ending in 'uppclonline.com' or 'gov.in'.",
            related_services_links=[
                {"name": "UPPCL New Connection Request", "link": "https://www.uppclonline.com/dispatch/portal/app.jsp?pageid=new_connection"},
                {"name": "Varanasi Water Tax Bill Payment", "link": "https://vnn.org.in/"}
            ]
        )

        varanasi_water = Service(
            district_id=varanasi.id,
            name="Varanasi Nagar Nigam Water Bill",
            slug="varanasi-water-bill",
            category="WATER",
            official_link="https://vnn.org.in/",
            step_by_step_guide=[
                "Visit the Varanasi Nagar Nigam official portal at https://vnn.org.in/",
                "Click on the 'Online Services' menu and choose 'Water/House Tax Payment'.",
                "Enter your Ward Number and House Number or PIN / Consumer Number.",
                "Review the outstanding water and sewage tax details.",
                "Click on 'Pay Now' to open the secure payment gateway.",
                "Complete the payment and download the municipal stamp receipt."
            ],
            faqs=[
                {"question": "Is sewage tax included in the water bill in Varanasi?", "answer": "Yes, Varanasi Nagar Nigam charges a combined water and sewage tax calculated based on house valuation."},
                {"question": "Where can I dispute an incorrect water bill reading?", "answer": "You can visit the Nagar Nigam office at Sigra, Varanasi, with your past three receipts and current meter readings."}
            ],
            warning_notes="Never pay any physical agent without demanding an official printed Nagar Nigam machine-generated receipt. Check that the payment URL is secured with HTTPS and hosts the vnn.org.in domain.",
            related_services_links=[
                {"name": "Varanasi Nagar Nigam House Tax", "link": "https://vnn.org.in/"},
                {"name": "UPPCL Electricity Bill Payment", "link": "https://www.uppclonline.com/"}
            ]
        )

        bengaluru_elec = Service(
            district_id=bengaluru.id,
            name="BESCOM Electricity Bill Payment",
            slug="bescom-electricity-bill",
            category="ELECTRICITY",
            official_link="https://bescom.karnataka.gov.in/",
            step_by_step_guide=[
                "Visit the BESCOM official website or direct payment portal.",
                "Enter your 10-digit Account ID printed on your bill copy.",
                "Click on 'Submit' to fetch the outstanding details.",
                "Check the consumer name and the billing month details.",
                "Choose your preferred payment gateway (SBI, BillDesk, etc.).",
                "Authorize payment via UPI or Cards and download the e-receipt."
            ],
            faqs=[
                {"question": "Can I enroll in the Gruha Jyothi scheme to get free electricity?", "answer": "Yes, Karnataka residents can register on the Seva Sindhu portal to receive up to 200 units of free monthly power if linked to their Aadhaar card."},
                {"question": "What is the BESCOM customer care helpline?", "answer": "You can call BESCOM helpline at 1912 for power outages or billing complaints, available 24/7."}
            ],
            warning_notes="WARNING: Scammers frequently send fake messages claiming your power will be disconnected because of a pending update. BESCOM will never ask you to download any .apk files or call personal mobile numbers.",
            related_services_links=[
                {"name": "Gruha Jyothi Free Electricity Registration", "link": "https://sevasindhugs.karnataka.gov.in/"},
                {"name": "BWSSB Bengaluru Water Bill Payment", "link": "https://bwssb.karnataka.gov.in/"}
            ]
        )
        session.add_all([varanasi_elec, varanasi_water, bengaluru_elec])
        await session.flush()

        print("Seeding Blog Post...")
        # 5. Blog Post
        blog = BlogPost(
            title="Essential Guide to Avoiding Utility Bill Frauds in India",
            slug="avoiding-utility-bill-frauds",
            author_id=super_admin.id,
            status="PUBLISHED",
            meta_title="Avoid Utility Bill Frauds: Official Guidelines | India Utility Portal",
            meta_description="Learn how to spot fake electricity bill SMS alerts, verify official government portals (gov.in), and safely pay your electricity and water taxes online.",
            content_blocks=[
                {
                    "id": "blk-1",
                    "type": "heading",
                    "data": {"level": 2, "text": "The Rise of Electricity Bill Disconnection Scams"}
                },
                {
                    "id": "blk-2",
                    "type": "paragraph",
                    "data": {"text": "Over the past year, thousands of citizens across states like Uttar Pradesh, Maharashtra, and Karnataka have reported receiving fraudulent SMS or WhatsApp alerts. These messages typically threaten immediate disconnection of electricity supply by 9:30 PM due to a failure in updating the previous month's bill details."}
                },
                {
                    "id": "blk-3",
                    "type": "warning",
                    "data": {
                        "title": "Spotting the Red Flags",
                        "text": "1. Messages sent from individual personal 10-digit mobile numbers rather than official bulk SMS senders (e.g. AD-UPPCL, BESCOM).\n2. Requesting you to call a specific mobile number to resolve the issue.\n3. Prompting you to download remote access screen-sharing apps like AnyDesk, TeamViewer, or install unknown APKs."
                    }
                },
                {
                    "id": "blk-4",
                    "type": "heading",
                    "data": {"level": 3, "text": "Official Verification & Safety Checklist"}
                },
                {
                    "id": "blk-5",
                    "type": "paragraph",
                    "data": {"text": "To stay safe, always observe the following strict procedures whenever paying municipal taxes or state electricity charges online:"}
                },
                {
                    "id": "blk-6",
                    "type": "faq",
                    "data": {
                        "question": "How do I verify if a link is official?",
                        "answer": "Official utility sites run by state governments always end in '.gov.in' or belong to registered corporations (e.g., uppclonline.com, bescom.co.in). Look for the HTTPS lock icon and avoid clicking links received via chat apps."
                    }
                },
                {
                    "id": "blk-7",
                    "type": "cta",
                    "data": {
                        "text": "Browse Official State Directories",
                        "link": "/uttar-pradesh"
                    }
                }
            ]
        )
        session.add(blog)
        await session.commit()
        print("Database successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed_data())
