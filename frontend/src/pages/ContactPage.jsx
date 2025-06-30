import React from 'react';

const ContactPage = () => {
  return (
    <div className="contact-container">
      <div className="header-section">
        <h1 className="page-title">Contact Us</h1>
        <p className="description">
          Have questions or need support? Reach out to us and we'll respond as quickly as possible.
        </p>
      </div>

      <div className="contact-content">
        <div className="contact-section">
          <h2 className="section-heading">Get in Touch</h2>
          
          <div className="contact-details">
            <div className="contact-item">
              <h3 className="contact-title">Email</h3>
              <p className="contact-info">
                <a href="mailto:contact@lawx.space" className="link">contact@lawx.space</a>
              </p>
              <p className="contact-subtext">We'll respond within 24 hours</p>
            </div>

            <div className="contact-item">
              <h3 className="contact-title">Phone</h3>
              <p className="contact-info">+91 9873777831</p>
              <p className="contact-subtext">Mon-Fri, 9 AM - 6 PM IST</p>
            </div>

            <div className="contact-item">
              <h3 className="contact-title">Address</h3>
              <p className="contact-info">
                15-C Second Floor DDA Flats<br />
                Pandav Nagar, New Delhi-110008<br />
                India
              </p>
            </div>

            <div className="contact-item">
              <h3 className="contact-title">Business Hours</h3>
              <p className="contact-info">Monday - Friday</p>
              <p className="contact-subtext">9:00 AM - 6:00 PM IST</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .contact-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          color: #000;
          line-height: 1.6;
          background: #fff;
        }

        .header-section {
          text-align: center;
          margin-bottom: 3rem;
          padding: 2rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #000;
        }

        .description {
          font-size: 1.1rem;
          color: #666;
          max-width: 600px;
          margin: 0 auto;
        }

        .contact-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .section-heading {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #000;
          text-align: center;
        }

        .contact-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .contact-item {
          padding: 1.5rem;
          background: #f9f9f9;
          text-align: center;
        }

        .contact-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #000;
        }

        .contact-info {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #000;
        }

        .contact-subtext {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .link {
          color: #000;
          text-decoration: underline;
          font-weight: 500;
        }

        .link:hover {
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .contact-container {
            padding: 1rem;
          }

          .page-title {
            font-size: 1.75rem;
          }

          .contact-details {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .contact-item {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactPage; 