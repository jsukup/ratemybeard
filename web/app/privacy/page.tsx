import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <img 
          src="/images/ratemybeard-logo.png" 
          alt="RateMyBeard Logo" 
          className="h-16 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">Effective Date: January 1, 2025</p>
      </div>

      <Card className="p-6 md:p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to RateMyBeard ("we," "our," or "us"). This Privacy Policy explains how we collect, use, and protect your information when you use our anonymous image rating platform. By using RateMyBeard, you agree to the terms outlined in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">2.1 User-Provided Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Username:</strong> A unique screen name you choose for your submissions</li>
                <li><strong>Images:</strong> Photos you upload to our platform</li>
                <li><strong>Ratings:</strong> Scores you provide when rating other users' images</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>IP Address:</strong> Used for rate limiting and security purposes</li>
                <li><strong>Session Data:</strong> Temporary data to prevent duplicate submissions</li>
                <li><strong>Usage Analytics:</strong> Anonymous usage statistics to improve our service</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Anonymous Operations</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            RateMyBeard operates as an anonymous platform. We do not require or collect:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Real names or personal identification</li>
            <li>Email addresses or contact information</li>
            <li>Social media profiles or external account links</li>
            <li>Payment information or financial data</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            <strong>Important:</strong> Your chosen username is your only identifier on our platform. Safeguard this username if you wish to check your ratings in the future, as we cannot recover or reset usernames.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Image Ownership and Rights</h2>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              By uploading images to RateMyBeard, you transfer full ownership of those images to RateMyBeard.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">4.1 Rights Transfer</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Images become the exclusive property of RateMyBeard upon submission</li>
                <li>You waive all copyright, moral rights, and other intellectual property claims</li>
                <li>RateMyBeard gains unlimited rights to use, modify, distribute, and display images</li>
                <li>You cannot request removal of images for personal reasons after submission</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">4.2 Content Requirements</h3>
              <p className="text-muted-foreground leading-relaxed">
                You warrant that all submitted images are original content you own or have full rights to transfer. You must not submit copyrighted material, images of other persons without consent, or any content that violates our Image Policy.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Image Deletion Policy</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Images submitted to RateMyBeard will only be deleted if they violate our Image Policy. We do not delete images for personal requests, change of mind, or other non-violation reasons.
            </p>
            <div>
              <h3 className="text-lg font-medium mb-2">5.1 Violation-Based Deletion</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">Images will be flagged and deleted if they:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Do not contain beards as the primary subject</li>
                <li>Include inappropriate, vulgar, or sexual content</li>
                <li>Violate community standards or applicable laws</li>
                <li>Contain copyrighted material or infringe on others' rights</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">5.2 Review Process</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our content moderation system uses both automated AI detection and human review to identify policy violations. Decisions are final and not subject to appeal.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Data Security and Storage</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Secure cloud storage with encryption at rest and in transit</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls limiting data access to authorized personnel only</li>
              <li>Session-based temporary storage for preventing duplicate submissions</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              However, no online service can guarantee 100% security. Use our platform at your own risk and do not submit images you would not want to be publicly accessible.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data Usage and Sharing</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">7.1 How We Use Your Data</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Display submitted images publicly for community rating</li>
                <li>Calculate and display rating statistics and leaderboards</li>
                <li>Prevent spam, abuse, and duplicate submissions</li>
                <li>Improve platform functionality and user experience</li>
                <li>Ensure compliance with our policies and applicable laws</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">7.2 Third-Party Sharing</h3>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, rent, or share personal data with third parties for marketing purposes. We may share data only when required by law, to protect our rights, or with service providers who assist in platform operations under strict confidentiality agreements.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Rate Limiting and Abuse Prevention</h2>
          <p className="text-muted-foreground leading-relaxed">
            To maintain platform integrity and prevent abuse, we implement:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Daily rating limits (50 ratings per IP address)</li>
            <li>Session-based duplicate submission prevention</li>
            <li>Automated detection of suspicious activity patterns</li>
            <li>IP-based temporary restrictions for policy violations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Age Requirements</h2>
          <p className="text-muted-foreground leading-relaxed">
            RateMyBeard is intended for users 18 years of age and older. By using our platform, you confirm that you are at least 18 years old. We do not knowingly collect information from minors and will delete accounts if we discover underage usage.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. International Users and Data Transfers</h2>
          <p className="text-muted-foreground leading-relaxed">
            RateMyBeard operates globally and may transfer, store, and process data in countries other than your residence. By using our service, you consent to such transfers. We comply with applicable data protection laws including GDPR for EU users and CCPA for California residents.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date. Continued use of RateMyBeard after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            Due to the anonymous nature of our platform, we do not provide direct customer support. For legal inquiries or law enforcement requests, contact us through our hosting provider or submit requests through appropriate legal channels.
          </p>
        </section>

        <section className="border-t pt-6 mt-8">
          <p className="text-sm text-muted-foreground">
            <strong>Last Updated:</strong> January 1, 2025<br/>
            <strong>Effective Date:</strong> January 1, 2025<br/>
            By using RateMyBeard, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
          </p>
        </section>
      </Card>

      <div className="text-center mt-8">
        <a 
          href="/" 
          className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
        >
          ← Back to RateMyBeard
        </a>
      </div>
    </main>
  );
}