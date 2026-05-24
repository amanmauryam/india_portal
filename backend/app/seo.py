import re
from typing import Any, Dict, List, Optional

class SEOEngine:
    @staticmethod
    def render_template(template_str: str, context: Dict[str, Any]) -> str:
        """
        Replaces placeholders like {state_name}, {district_name}, {service_name}, {category}
        with the correct values from the context dictionary.
        """
        if not template_str:
            return ""
            
        def replacement(match):
            key = match.group(1)
            # Fetch nested attributes if any or return default empty
            val = context.get(key, "")
            if val is None:
                return ""
            return str(val)
            
        # Matches patterns like {district_name}
        return re.sub(r"\{([a-zA-Z0-9_]+)\}", replacement, template_str)

    @staticmethod
    def generate_district_content(district_name: str, state_name: str) -> Dict[str, Any]:
        """
        Auto-generates high-value, unique hyperlocal content for empty district overview sheets.
        """
        overview = (
            f"Welcome to the official hyperlocal administrative utility portal for {district_name} District, "
            f"located in the vibrant state of {state_name}. {district_name} has a rich historic heritage, "
            f"bustling local trade networks, and distinct municipal infrastructure. This directory indexes "
            f"all primary citizen services, electric billing links, water tax gateways, and local government contacts."
        )
        famous_places = [
            {"name": f"{district_name} Central Heritage Corridor", "description": f"A historic cultural center celebrating local traditions in {district_name}."},
            {"name": f"Nagar Palace Gardens", "description": f"Scenic natural reservation and landscape gardens managed by the local district administration."}
        ]
        industries_overview = (
            f"The primary economy of {district_name} District is driven by active handloom cottage sectors, "
            f"regional agriculture, small scale manufacturing hubs, and municipal retail trade centers."
        )
        odop = {
            "product_name": f"{district_name} Traditional Handicrafts & Agriculture",
            "description": f"Signature premium local goods hand-crafted under the One District One Product (ODOP) initiative of the state of {state_name}.",
            "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"
        }
        emergency_contacts = {
            "police": "112 / 100",
            "fire": "101",
            "ambulance": "108 / 102",
            "helpline": "181"
        }
        most_searched_queries = [
            f"Online water bill payment in {district_name}",
            f"{district_name} police emergency helpline number",
            f"Official municipality address {district_name}"
        ]
        
        return {
            "overview": overview,
            "famous_places": famous_places,
            "railway_stations": [f"{district_name} Railway Station", f"{district_name} Cantonment Junction"],
            "industries_overview": industries_overview,
            "odop": odop,
            "emergency_contacts": emergency_contacts,
            "most_searched_queries": most_searched_queries
        }

    @staticmethod
    def generate_service_content(service_name: str, district_name: str, state_name: str, category: str) -> Dict[str, Any]:
        """
        Auto-generates official guide pages, phishing warning cards, and FAQs for utility services.
        """
        category_label = category.capitalize()
        warning_notes = (
            f"IMPORTANT PHISHING WARNING: Citizens of {district_name} are advised that official payments for "
            f"{service_name} must ONLY be processed through the secure verified gov.in portals. Avoid third-party "
            f"SMS payment alerts received from personal mobile numbers. The official link ends in gov.in or the "
            f"registered utility board domain."
        )
        step_by_step_guide = [
            f"Access the official portal for {service_name}.",
            f"Verify the security seal (HTTPS) in your browser address bar.",
            f"Locate the online billing input field and enter your unique Customer Account Number.",
            f"Confirm outstanding bill details, name, and due date against physical receipts.",
            f"Select your payment method (UPI, netbanking, or debit card) and proceed securely.",
            f"Download the system-generated receipt for future verification with the {district_name} municipal body."
        ]
        faqs = [
            {
                "question": f"Is this the official portal for {service_name}?",
                "answer": f"No, BharatLocal is a hyperlocal index directory providing official direct link gateways, guidelines, and safety advisories for {service_name} in {district_name}."
            },
            {
                "question": f"What should I do if my payment fails?",
                "answer": f"Please verify transaction status on the official gateway page or contact the registered helpline. Never share your banking OTP with any agent."
            }
        ]
        related_services_links = [
            {"name": f"{district_name} Water Tax Gateway", "link": "/water-bill"},
            {"name": f"{district_name} Nagar Nigam Helpdesk", "link": "/government-services"}
        ]
        
        return {
            "warning_notes": warning_notes,
            "step_by_step_guide": step_by_step_guide,
            "faqs": faqs,
            "related_services_links": related_services_links
        }

    @staticmethod
    def get_schema_markup(page_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates automated search-optimized JSON-LD schema markups.
        """
        if page_type == "BREADCRUMB":
            # data: {"items": [{"name": "Home", "url": "/"}, {"name": "UP", "url": "/up"}]}
            items = data.get("items", [])
            schema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": idx + 1,
                        "name": item["name"],
                        "item": item.get("url")
                    } for idx, item in enumerate(items)
                ]
            }
            return schema
            
        elif page_type == "FAQ":
            # data: {"faqs": [{"question": "", "answer": ""}]}
            faqs = data.get("faqs", [])
            schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": faq["question"],
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": faq["answer"]
                        }
                    } for faq in faqs
                ]
            }
            return schema
            
        elif page_type == "SERVICE":
            # data: {"name": "", "official_link": "", "district_name": "", "category": ""}
            schema = {
                "@context": "https://schema.org",
                "@type": "GovernmentService",
                "serviceName": data.get("name"),
                "provider": {
                    "@type": "GovernmentOrganization",
                    "name": f"{data.get('district_name')} District Administration"
                },
                "serviceUrl": data.get("official_link"),
                "category": data.get("category"),
                "description": f"Official verified payment gateway links and administrative guides for {data.get('name')} in {data.get('district_name')} District."
            }
            return schema
            
        return {}
