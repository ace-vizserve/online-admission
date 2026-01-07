import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  schemaMarkup?: Record<string, any>;
}

export const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5173/";

const SEO: React.FC<SEOProps> = ({ title, description, canonical, image, schemaMarkup }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {canonical && <link rel="canonical" href={canonical} />}
    {/* Open Graph */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {image && <meta property="og:image" content={image} />}
    {/* Twitter Card */}
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {image && <meta name="twitter:image" content={image} />}
    {/* Structured Data */}
    {schemaMarkup && <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>}
  </Helmet>
);

export default SEO;
