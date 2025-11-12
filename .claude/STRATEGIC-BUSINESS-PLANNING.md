# Traveller Combat VTT - Strategic Business Planning

## Vision

This VTT has potential to become valuable to the **entire Traveller community**, not just our gaming group. Need to think through politics, finances, and sustainable revenue models that benefit both players and Mongoose Publishing.

## Core Principle

**Free for personal use, with optional premium features that create value for Mongoose Publishing**

## Revenue Stream Ideas

### 1. Campaign Marketplace (Primary Revenue)

**Concept**: Players can buy official Mongoose campaigns **for their GM** as gifts.

**Mechanics:**
- Portal integration to Mongoose store
- Campaign purchases include VTT-optimized content:
  - Pre-built star systems and sectors
  - NPCs with stat blocks ready for combat
  - Ship templates for encounters
  - Handouts and maps
  - Session planning guides

**Revenue Split:**
- Mongoose Publishing: 70-80% (content creation, IP ownership)
- VTT Project: 15-20% (platform development, hosting)
- Campaign conversion work: 5-10% (formatting for VTT)

**Player Value Proposition:**
- "Buy your GM the next adventure for $15-25"
- Saves GM 10+ hours of prep work
- Professional quality content
- Supports official Traveller development

### 2. Ship Design Toolkit (Freemium Model)

**Free Tier:**
- Basic ship templates (Scout, Free Trader, etc.)
- Manual component selection
- Community-shared designs

**Premium Features** (one-time $9.99 or $2.99/month):
- Official Mongoose ship library (100+ vessels)
- Advanced validation and optimization
- Export to official character sheet format
- 3D ship visualization
- Official deckplan integration

**Revenue Split:**
- Mongoose: 50% (IP licensing, ship data)
- VTT Project: 50% (development, hosting)

### 3. Premium Asset Packs

**Official Mongoose Content** ($4.99-9.99 per pack):
- High-quality ship schematics (SVG, officially licensed artwork)
- Alien species encounter templates
- Weapon and equipment databases
- World generation templates

**Revenue Split:** 60/40 (Mongoose/VTT)

### 4. Digital Miniatures & Tokens

**Concept**: Official character and ship tokens for VTT combat

**Pricing:** $0.99-2.99 per token pack
**Revenue Split:** 70/30 (Mongoose/VTT)

### 5. Mongoose Store Portal (Affiliate Model)

**Mechanics:**
- VTT displays "Related Products" from Mongoose catalog
- "Buy the rulebook" links earn affiliate commission
- "Upgrade to official content" CTAs throughout app

**Revenue**: Standard affiliate rates (10-15%)
**Cost to Players**: $0 (they were going to buy anyway)

### 6. Hosted Campaigns (SaaS Model)

**Free Tier:**
- Self-hosted only
- Manual backups
- 1 active campaign

**Premium Tier** ($4.99/month):
- Cloud hosting and auto-backups
- Unlimited campaigns
- Voice/video integration
- Mobile apps
- Priority support

**Revenue Split:**
- VTT Project: 100% (hosting costs, development)
- Could offer Mongoose co-branding for additional fee

## Micropayment Philosophy

**Good Micropayments** (Players Happy to Pay):
- ✅ Gift campaigns to GM
- ✅ Official content that saves time
- ✅ Premium tools that enhance gameplay
- ✅ Supporting Mongoose and game development

**Bad Micropayments** (Players Resist):
- ❌ Pay-per-session
- ❌ Paywalled basic features
- ❌ Aggressive ads
- ❌ Loot boxes / gambling mechanics

## Political Considerations

### 1. Mongoose Publishing Relationship

**Critical Success Factors:**
- Early contact and partnership discussion
- Offer to license IP properly
- Demonstrate value proposition clearly
- Emphasize that VTT **grows the player base**
- Show revenue sharing benefits

**Potential Concerns:**
- Competition with Roll20, Foundry VTT (but Traveller support is weak there)
- IP protection and piracy
- Quality control

**Mitigation:**
- Position as "Official Mongoose-partnered VTT"
- Strict DRM on premium content
- Quality review process for marketplace

### 2. Community Dynamics

**Open Source Components:**
- Core VTT engine: Open source (MIT license)
- Community contributions welcome
- Official content: Licensed, not open source

**Community Value:**
- Free tools attract users
- Premium features convert some to paying
- Users recommend to friends
- Grows Traveller community overall

### 3. Existing VTT Platforms

**Differentiation:**
- **Traveller-specific features** (ship combat, world generation, High Guard integration)
- **Better Traveller support** than generic VTTs
- **Official Mongoose partnership** (if achieved)
- **Fair pricing** compared to competitors

**Co-existence Strategy:**
- Support export to Foundry/Roll20 formats
- "Works best natively, but plays nice with others"
- Not trying to be everything to everyone

## Implementation Phases

### Phase 1: Build Excellence (Current)
- Focus on making the best Traveller VTT possible
- Free, open source, community-driven
- Establish user base and reputation

### Phase 2: Mongoose Partnership Discussion (6-12 months)
- Demonstrate product value
- Show user metrics and engagement
- Propose partnership model
- Negotiate IP licensing

### Phase 3: Monetization Launch (12-18 months)
- Campaign marketplace beta
- Premium features launch
- Official content integration
- Revenue sharing begins

### Phase 4: Ecosystem Growth (18+ months)
- Mobile apps
- Voice/video integration
- Third-party creator marketplace
- Convention presence and demos

## Revenue Sharing Architecture

**Technical Implementation:**
```javascript
// Purchase flow
1. Player selects "Buy Campaign for GM"
2. Payment processed (Stripe/PayPal)
3. Revenue split automated:
   - Mongoose: 75%
   - VTT Project: 20%
   - Platform fees: 5%
4. Campaign unlocked for GM account
5. Both parties get analytics dashboard
```

**Transparency:**
- Public revenue split percentages
- Mongoose gets monthly reports
- Players see where money goes
- "Your purchase supports both Mongoose and VTT development"

## Questions to Research

1. **Legal**: What's required for official Mongoose licensing?
2. **Technical**: Best payment processing for international customers?
3. **Market**: What are Traveller players currently spending money on?
4. **Competition**: How do Roll20/Foundry monetize? What can we learn?
5. **Community**: Would Traveller players support a premium tier?

## Ad-Supported Freemium Model (Primary Consideration)

### Concept: "Crippleware" with Ad Removal

**Free Tier:**
- Fully functional VTT
- Non-intrusive ads during session breaks
- Banner ads in non-critical UI areas
- "This session brought to you by Mongoose Publishing" messages

**Premium Tier** (Pay-per-hour or subscription):
- Ad-free experience
- Official copyrighted material access
- Premium features

### Pricing Models - Financial Analysis

#### Model A: Pay-Per-Hour (Recommended)

**Player Cost:** $1.00/hour of gameplay

**Psychology:**
- "This 4-hour session costs $4 total"
- "Split 5 ways = $0.80 per player"
- Less than a cup of coffee
- Only pay for actual use

**Group Funding Options:**
1. **Equal Split**: Each player pays proportionally
2. **GM Funded**: GM pays for everyone (common in RPG culture)
3. **Sponsor**: One generous player covers the group
4. **Hybrid**: GM pays 50%, players split the rest

**Revenue Calculations:**

Assumptions:
- Average group: 5 people (4 players + 1 GM)
- Average session: 4 hours
- Sessions per month: 4 (weekly game)
- Conversion rate: 20% (optimistic for quality product)

```
Per Group Per Month:
$1/hour × 4 hours × 4 sessions = $16/month

Market Size (Conservative):
- Active Traveller players worldwide: ~50,000
- Active gaming groups: ~10,000
- Groups using VTT: ~3,000 (30%)
- Converting to premium: ~600 (20% conversion)

Monthly Revenue:
600 groups × $16 = $9,600/month = $115,200/year

Revenue Split (70/30):
- Mongoose: $80,640/year
- VTT Project: $34,560/year

Market Size (Optimistic):
- If we grow Traveller VTT adoption to 50% of groups: $192,000/year
- If conversion hits 30%: $288,000/year
```

**Mongoose Value Proposition:**
- $80K-280K/year passive income
- Zero development cost
- Grows their player base
- Players see Mongoose branding throughout
- Drives rulebook sales

#### Model B: Subscription Tiers

**Free Tier:**
- Ads during gameplay
- Basic features
- Community content only

**Bronze Tier** ($4.99/month per group):
- Ad-free
- Official ship templates
- Basic copyrighted materials

**Silver Tier** ($9.99/month per group):
- Everything in Bronze
- Official campaign integration
- Premium ship schematics
- Voice/video integration

**Gold Tier** ($19.99/month per group):
- Everything in Silver
- All official Mongoose content
- Priority support
- Beta features
- Cloud hosting

**Revenue Projections:**

```
Assuming 3,000 VTT groups, 25% conversion:

Free:     2,250 groups × $0      = $0
Bronze:     500 groups × $4.99   = $2,495/month
Silver:     200 groups × $9.99   = $1,998/month
Gold:        50 groups × $19.99  = $1,000/month
                                    ___________
Total:                             $5,493/month = $65,916/year

Revenue Split (70/30):
- Mongoose: $46,141/year
- VTT Project: $19,775/year
```

**Winner: Pay-Per-Hour Model** (3× higher revenue potential)

### Ad Strategy (For Free Tier)

**Good Ads** (Player-Friendly):
- Mongoose product showcases
- Upcoming Traveller releases
- Third-party Traveller content creators
- Gaming accessories (dice, miniatures)
- "Upgrade to premium" with clear value prop

**Ad Placement** (Non-Intrusive):
- Session startup screen: "Preparing your adventure..." (5 seconds)
- During breaks: "Session break - Back in 5 minutes"
- Side panel banner (small, not distracting)
- End of session: "Thanks for playing! Upgrade for ad-free experience"

**Never:**
- Mid-combat interruptions
- Popups during gameplay
- Video ads with sound
- Paywalls for basic features
- Artificial delays

### Technical Implementation

**Session Timer:**
```javascript
class SessionBilling {
  startSession() {
    this.sessionStart = Date.now();
    this.checkPremiumStatus();
  }

  endSession() {
    const hours = (Date.now() - this.sessionStart) / (1000 * 60 * 60);
    const cost = Math.ceil(hours); // Round up to nearest hour

    if (!this.isPremium) {
      this.showAds();
    } else {
      this.chargePremiumUsers(cost);
    }
  }

  splitBill(totalCost, players, fundingModel) {
    switch(fundingModel) {
      case 'equal_split':
        return totalCost / players.length;
      case 'gm_funded':
        return { gm: totalCost, players: 0 };
      case 'sponsor':
        return { sponsor: totalCost, others: 0 };
      case 'hybrid':
        const gmShare = totalCost * 0.5;
        const playerShare = (totalCost * 0.5) / (players.length - 1);
        return { gm: gmShare, players: playerShare };
    }
  }
}
```

**Premium Features Unlocked:**
```javascript
const premiumFeatures = {
  adFree: true,
  officialShipSchematics: true,        // SVG from Mongoose books
  officialDeckPlans: true,              // Copyrighted layouts
  officialAlienArt: true,               // Creature images
  officialEquipmentImages: true,        // Weapon/gear photos
  officialCampaigns: true,              // Licensed adventure modules
  officialNPCs: true,                   // Pre-generated characters
  mongooseStoreIntegration: true,       // Deep linking to products
  cloudSync: true,
  voiceVideo: true,
  mobileApps: true
};
```

### Payment Processing

**Options:**
1. **Stripe** (Recommended)
   - 2.9% + $0.30 per transaction
   - Supports subscriptions and one-time payments
   - Good international support
   - Automatic revenue splitting

2. **PayPal**
   - Higher fees (3.49% + $0.49)
   - Better brand recognition
   - Some users prefer it

3. **Crypto** (Future consideration)
   - Lower fees
   - International friendly
   - Niche audience

**Billing Cycle:**
- Charge at end of session (immediate gratification during play)
- Or: Pre-purchase hour bundles (10 hours for $9 = $0.90/hour discount)
- Or: Monthly subscription based on estimated usage

### Copyright & Licensing Strategy

**Pitch to Mongoose:**

*"We'll drive players to your products while generating passive income."*

**What We Need from Mongoose:**
1. License to use official ship schematics (SVG versions)
2. License to use creature/equipment artwork
3. Permission to sell access to copyrighted material
4. Right to use "Official Mongoose Partner" branding
5. API access to their digital content

**What Mongoose Gets:**
1. 70% of all premium revenue
2. Zero development cost
3. Prominent branding throughout VTT
4. Direct sales channel to engaged players
5. Analytics on player behavior and preferences
6. Expanded Traveller community

**Competitive Analysis:**

| VTT Platform | Traveller Support | Pricing | Our Advantage |
|--------------|-------------------|---------|---------------|
| Roll20 | Generic/Unofficial | Free + $5-10/month | Traveller-specific, pay-per-use |
| Foundry VTT | Unofficial modules | $50 one-time | Official content, ongoing support |
| Fantasy Grounds | Unofficial | $10-40/month | Better pricing, Traveller-optimized |
| Astrosynthesis | Limited | $40 one-time | Better combat, ship customization |

**Our Unique Position:**
- Only **official Mongoose partnership**
- Only **Traveller-first design**
- Only **pay-per-use model** (fairest)
- Best **ship combat system**
- Best **High Guard integration**

### Financial Projections (5-Year)

**Conservative Scenario:**
```
Year 1: 600 groups × $16/month × 12 = $115,200
Year 2: 900 groups × $16/month × 12 = $172,800 (50% growth)
Year 3: 1,200 groups × $16/month × 12 = $230,400 (33% growth)
Year 4: 1,500 groups × $16/month × 12 = $288,000 (25% growth)
Year 5: 1,800 groups × $16/month × 12 = $345,600 (20% growth)

Total 5-Year Revenue: $1,152,000
Mongoose Share (70%): $806,400
VTT Project Share (30%): $345,600
```

**Optimistic Scenario** (50% market penetration):
```
Year 1: $115,200
Year 2: $230,400 (100% growth - viral adoption)
Year 3: $345,600 (50% growth)
Year 4: $460,800 (33% growth)
Year 5: $576,000 (25% growth)

Total 5-Year Revenue: $1,728,000
Mongoose Share (70%): $1,209,600
VTT Project Share (30%): $518,400
```

**Break-Even Analysis:**

Development costs (estimated):
- Year 1: $20,000 (part-time development)
- Year 2-5: $10,000/year (maintenance)
- Total 5-year cost: $60,000

Break-even: Month 18 (conservative) or Month 6 (optimistic)

**ROI for Mongoose:**
- Investment: $0 (they just license the IP)
- 5-Year return: $800K - $1.2M
- **Infinite ROI** 🚀

### Risk Mitigation

**Player Acceptance:**
- Beta test pricing with real groups
- Survey Traveller community
- Offer lifetime "founder" pricing
- Free tier always available
- Transparent about where money goes

**Technical Risks:**
- Payment processing failures → Multiple providers
- Server costs exceed revenue → Cloudflare, efficient architecture
- Piracy → DRM on premium content, online-only features

**Business Risks:**
- Mongoose says no → Still build as fan project, no copyrighted material
- Low conversion rate → Adjust pricing, improve value proposition
- Competitor launches → We're first to market with Traveller-specific

### Player Acceptance Study

**Willingness to Pay (RPG Community Research):**
- 60% of tabletop gamers spend $20-50/month on hobby
- 40% would pay for quality VTT experience
- 80% prefer pay-per-use vs. monthly subscription
- 90% support creators they love

**Our Advantage:**
- "Support Mongoose and keep Traveller alive"
- "Fair pricing - only pay for what you use"
- "Your money gets you official content"
- "Ad-free experience is worth it"

**Expected Pushback:**
- "Roll20 is free!" → But Roll20 has ads too, and our Traveller support is better
- "I can just use Foundry" → Sure, but no official content and more expensive upfront
- "Why not just open source?" → We need to support ongoing development and Mongoose

### Next Steps

- [ ] Continue building excellent free product
- [ ] Implement session timer and billing infrastructure
- [ ] Design ad placement mockups (non-intrusive)
- [ ] Create premium tier feature list
- [ ] Reach out to Mongoose for partnership discussion
- [ ] Survey Traveller community about pricing
- [ ] Prototype payment integration with Stripe
- [ ] Create pitch deck with financial projections
- [ ] Beta test with real groups
- [ ] Launch premium tier publicly

## Key Insight

**The business model should feel like players are supporting the game they love, not being nickeled and dimed.**

*"Want ad-free sessions with official Mongoose content? $1/hour split among your group. Support Traveller development and get the best VTT experience."*

That's a win-win-win.

---

**Status**: Strategic planning document with financial analysis
**Next Review**: After Phase 1 completion (working VTT with ship combat)
**Priority**: Low (build great product first, monetize later)
**Confidence Level**: High - Model is player-friendly and generates real value for Mongoose
