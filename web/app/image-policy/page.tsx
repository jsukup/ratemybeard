import { Card } from "@/components/ui/card";

export default function ImagePolicy() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <img 
          src="/images/ratemyfeet-logo.png" 
          alt="RateMyFeet Logo" 
          className="h-16 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-white">Image Policy</h1>
        <p className="text-muted-foreground mt-2">Community Standards and Content Guidelines</p>
      </div>

      <Card className="p-6 md:p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Purpose and Scope</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Image Policy governs all visual content submitted to RateMyFeet. Our platform is specifically designed for rating the aesthetic appeal of feet, and all submissions must comply with these guidelines to maintain a respectful and appropriate community environment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Acceptable Content</h2>
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ✓ Images that ARE allowed:
              </p>
              <ul className="list-disc pl-6 text-green-700 dark:text-green-300 space-y-1">
                <li>Clear, well-lit photos of feet as the primary subject</li>
                <li>Feet in natural, non-suggestive poses</li>
                <li>Clean, well-groomed feet without injuries or medical conditions</li>
                <li>Feet wearing socks, shoes, or other non-revealing footwear</li>
                <li>Artistic or aesthetic photography focusing on feet</li>
                <li>Photos taken in appropriate, non-intimate settings</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">2.1 Quality Standards</h3>
              <p className="text-muted-foreground leading-relaxed">
                To ensure the best user experience, submitted images should be:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                <li>Clear and well-focused (not blurry or pixelated)</li>
                <li>Properly lit and visible</li>
                <li>Appropriate resolution for viewing and rating</li>
                <li>Free from excessive filters or digital manipulation</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Prohibited Content</h2>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="font-semibold text-red-800 dark:text-red-200 mb-2">
                ✗ Images that are STRICTLY FORBIDDEN:
              </p>
              <ul className="list-disc pl-6 text-red-700 dark:text-red-300 space-y-1">
                <li>Images containing genitalia, nudity, or sexual content</li>
                <li>Feet involved in sexual, vulgar, or inappropriate conduct</li>
                <li>Images with fetishistic or explicitly sexual elements</li>
                <li>Photos taken in bathrooms, bedrooms, or intimate settings</li>
                <li>Images showing feet in contact with inappropriate objects</li>
                <li>Content that sexualizes or objectifies feet in inappropriate ways</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">3.1 Additional Restrictions</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                The following content is also prohibited:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Non-Feet Content:</strong> Images where feet are not the primary subject</li>
                <li><strong>Medical Content:</strong> Images showing injuries, infections, or medical conditions</li>
                <li><strong>Illegal Activity:</strong> Images depicting illegal substances, activities, or content</li>
                <li><strong>Copyrighted Material:</strong> Images you do not own or have rights to use</li>
                <li><strong>Minors:</strong> Any images of persons under 18 years of age</li>
                <li><strong>Harassment:</strong> Images intended to harass, intimidate, or harm others</li>
                <li><strong>Deceptive Content:</strong> Heavily edited or manipulated images misrepresenting reality</li>
                <li><strong>Spam:</strong> Duplicate submissions or irrelevant content</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Content Moderation Process</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">4.1 Automated Review</h3>
              <p className="text-muted-foreground leading-relaxed">
                All submitted images undergo automated AI-powered content moderation that screens for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                <li>Explicit or adult content detection</li>
                <li>Violence or disturbing imagery</li>
                <li>Inappropriate or suggestive content</li>
                <li>Technical quality assessment</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">4.2 Human Review</h3>
              <p className="text-muted-foreground leading-relaxed">
                Images flagged by our automated system or reported by users undergo human review by our moderation team. This process includes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                <li>Detailed policy compliance assessment</li>
                <li>Context evaluation and intent analysis</li>
                <li>Community standards verification</li>
                <li>Final approval or rejection decision</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Enforcement Actions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">5.1 Policy Violations</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                When images violate our policy, we take the following actions:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Immediate Removal:</strong> Images are immediately removed from public view</li>
                <li><strong>Permanent Deletion:</strong> Violating images are permanently deleted from our servers</li>
                <li><strong>No Restoration:</strong> Deleted images cannot be recovered or restored</li>
                <li><strong>Account Restrictions:</strong> Repeat violations may result in submission restrictions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">5.2 Flagging System</h3>
              <p className="text-muted-foreground leading-relaxed">
                Community members can report inappropriate content through our flagging system. Reports are reviewed promptly, and appropriate action is taken based on policy violations.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. User Responsibilities</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              By submitting images to RateMyFeet, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Ensure all content complies with this Image Policy</li>
              <li>Verify you have full rights to submit the images</li>
              <li>Understand that policy violations result in permanent deletion</li>
              <li>Accept that moderation decisions are final and not subject to appeal</li>
              <li>Report inappropriate content you encounter on the platform</li>
              <li>Respect the community and other users' contributions</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Community Standards</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              RateMyFeet strives to maintain a respectful, appropriate, and welcoming community. Our standards include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Respectful Environment:</strong> Content should contribute to a positive community atmosphere</li>
              <li><strong>Appropriate Focus:</strong> All content must maintain focus on aesthetic appreciation of feet</li>
              <li><strong>Legal Compliance:</strong> All content must comply with applicable laws and regulations</li>
              <li><strong>Ethical Standards:</strong> Content should not exploit, objectify, or demean individuals</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Legal Considerations</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">8.1 Copyright and Ownership</h3>
              <p className="text-muted-foreground leading-relaxed">
                You must own full rights to any image you submit. Submitting copyrighted material without permission is strictly prohibited and may result in legal action.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">8.2 Right to Use</h3>
              <p className="text-muted-foreground leading-relaxed">
                By submitting images, you grant RateMyFeet unlimited rights to use, display, modify, and distribute the content. This transfer of rights is permanent and irrevocable.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Policy Updates</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Image Policy may be updated periodically to reflect changes in community standards, legal requirements, or platform features. Users are responsible for staying informed about policy changes. Continued use of the platform constitutes acceptance of policy updates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Reporting Violations</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you encounter content that violates this Image Policy, please use our reporting system to flag the content for review. Include specific details about the violation to help our moderation team take appropriate action.
          </p>
        </section>

        <section className="border-t pt-6 mt-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Remember: Content Moderation is Permanent
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Once an image is flagged and deleted for policy violations, it cannot be recovered, restored, or resubmitted. Please ensure your content complies with all guidelines before submission.
            </p>
          </div>
        </section>
      </Card>

      <div className="text-center mt-8">
        <a 
          href="/" 
          className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
        >
          ← Back to RateMyFeet
        </a>
      </div>
    </main>
  );
}