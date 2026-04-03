IPFS Implementations Cell
Grant Application for IPFS Implementations Cell
NIIIFTY 2

---

APPLICANT
General Information
Cell Name
IPFS Implementations Cell
Applicant Name
Mnemoscene
Entity Type
Private Company
Point of Contact
Sophie Dixon
One-Line Summary
Reusable Node.js modules for creating Stable IIIF Identifiers (IPNS) and enabling global Discovery (AT Protocol) on IPFS.
Grant Request
$25,000.00
Time Frame
9 weeks
Application Date
February 3, 2026

1. Executive Summary and Alignment:
   The first NIIIFTY grant successfully delivered robust IPFS Storage for IIIF content. NIIIFTY 2 is a foundational project to address the critical remaining challenges for full decentralization: Stable Identity and Global Discovery. This proposal will focus purely on core infrastructure. We will leverage Storacha’s w3name (IPNS) to create mutable pointers, allowing a IIIF Manifest's @id to remain stable and resolvable even when the underlying content is updated.

We will build an open-source, reusable Node.js publishing module that integrates with the AT Protocol (Bluesky) to solve the IIIF "Search Across" problem. By enabling any user or institution to publish a record to their own Bluesky account upon upload, we invert the traditional, high-cost "Pull" model (crawlers) to a scalable "Push" model (Firehose). This instantly makes new IPFS-hosted IIIF content globally discoverable. This project delivers foundational IPFS tooling, directly supporting the data layer's ability to handle mutable data and achieve global searchability, which is essential for institutional adoption of IPFS.

Crucially, we are extending the NIIIFTY codebase for immediate integration with our popular IIIF-powered storytelling platform, exhibit.so, which is used across the cultural and higher learning sectors. With exhibit.so approaching 15k created exhibits and drawing interest from resellers to complement existing publishing/catalogue systems, this work has a clear and immediate path to widespread adoption.

2. Point of Contact
   Sophie Dixon (sophie@mnemoscene.io)

---

PROJECT DESCRIPTION, DELIVERABLES AND OUTCOMES

1.  Project Description
    What pain point or opportunity does your project address?

The project addresses two main issues preventing decentralized IIIF from competing with centralized solutions:

1.  Stable Identity: Updating a IIIF Manifest on IPFS changes its immutable CID, breaking the Manifest's identifier (@id). This prevents stable, long-term resource sharing.
2.  Discovery is Broken: Content on IPFS is "dark." Previous IIIF Discovery efforts stalled because the required centralized "Pull" model (crawlers constantly polling for updates) proved too complex and expensive for the community to maintain.

    How will you do it? Include any important product or technical notes.

We will create a set of reusable, open-source Node.js modules that handle the core logic:

      1. IPNS Module: Implement the w3name service logic to generate stable, mutable IPNS pointers for every uploaded IIIF Manifest. This ensures the manifest's @id is stable (ipns://k51...) while the underlying IPFS hash can be updated.
      2. AT Protocol Publisher Module: Build a standalone, reusable Node.js module that allows the NIIIFTY Publisher (or any other application) to construct and publish IIIF content records (using and collaborating with Volker Mische on the emerging Matadisco schema) to an arbitrary AT Protocol account. The goal is to make this IIIF content instantly searchable by indexing systems, such as the one proposed by Volker Mische, by using the AT Protocol's Firehose. This module addresses the single-account concern by making the registry service fully decentralized.

Who are your target users? Why will they choose your solution over the status quo?

      * Target Users: Cultural institutions (museums, libraries, archives) and individual scholars in the IIIF Community.
      * Why our solution: NIIIFTY 2 provides a fully decentralized alternative to centralized hosting that offers True Decentralized Permanence (via IPNS) and Global Discoverability (via the AT Protocol's Firehose), a combination that currently does not exist. Users will choose it for long-term data durability and un-censorable public reach.

How will you get your first 10 users? First 100? (Or other relevant notes on adoption.)

We will leverage the existing NIIIFTY community (early-adopting institutions) for the first 10. For broader adoption, we will promote the new, reusable Node.js IPNS and AT Protocol
publishing modules directly to the IIIF and IPFS developer communities through NPM, GitHub, and presentations at relevant conferences. The focus on reusable components will
encourage integration by other projects. 2. Project Plan & Deliverables
Links to Github project boards or other public sources are welcome and encouraged.

      * Milestone 1: Project Set-up & Architecture (2 Weeks / $5,000.00)
      * Initial setup of GitHub repo and CI/CD pipeline.
      * Finalize architecture planning for the decentralized, reusable Node.js back-end modules.
      * Milestone 2: Core Functionality Implementation (6 Weeks / $17,000.00)
      * Mutable Data Layer (w3name/IPNS): Implement the core Node.js logic to generate IPNS key pairs and sign w3name revisions, pointing to the new Manifest CID.
      * NIIIFTY AT Protocol Publisher (Node.js Module): Build the reusable Node.js module for constructing and publishing AT records to an arbitrary AT Protocol account.
      * Manifest Logic: Update the IIIF Manifest generation to set the @id field to the stable IPNS URL.
      * Milestone 3: Demo, Docs & Handover (1 Week / $3,000.00)
      * Implementation of the "Global Search" Demo site that indexes the AT Protocol Firehose to demonstrate discovery and renders results using the stable IPNS URL.
      * Comprehensive Documentation (Readme/Wiki) on how to install and use the new Node.js modules for both IPNS and AT Protocol publishing.

         3. Impact (Objectives)

            * Deliver two foundational, reusable Node.js libraries for the IPFS ecosystem: one for robust IPNS/w3name management, and one for AT Protocol-based content discovery.
            * Achieve a fully decentralized publishing workflow for IIIF content that ensures stable, resolvable URLs that never break.
            * Prove the AT Protocol's "Push" architecture as a viable, scalable alternative to the stalled "Pull" model for global metadata discovery in the IIIF community.

               4. Measurement and Success
               * Successful completion of all three milestones within the 9-week timeframe and $25,000 budget.
               * The IPNS and AT Protocol Publisher Node.js modules are published to NPM and actively used in the NIIIFTY application.
               * The "Global Search" demo successfully indexes and displays newly published IIIF content via the AT Protocol.

---

TEAM AND EXPERTISE 1. Team members

                  * Sophie Dixon (Project Owner)

                     2. Relevant expertise


                     * Sophie Dixon: Project Owner and designer of Exhibit.so.

---

BUDGET 1. Total Amount Requested

Total amount requested: $25,000.00
Duration: 9 weeks

                     2. Budget breakdown

Expense 1
Milestone 1 (Setup & Architecture) $5,000.00
Expense 2
Milestone 2 (Core Functionality) $17,000.00
Expense 3
Milestone 3 (Demo, Docs & Handover) $3,000.00
Expense 4
N/A
TOTAL
$25,000.00
******\_\_\_\_******
REPORTING 1. Reporting:
We plan to provide bi-weekly updates via email to the advisory committee. Progress will be tracked transparently on the public GitHub project board, which will be kept up-to-date with task completion. We will present the final deliverables and reusable Node.js modules to the broader IPFS community through a blog post and a presentation at an IIIF Community meeting. 2. Do you agree to open source all work you do on behalf of this grant under the MIT/Apache-2 dual-license?:
_ Yes
_ No

---

ADDITIONAL INFORMATION
Any additional information that you think would be useful in helping us to evaluate your proposal.
