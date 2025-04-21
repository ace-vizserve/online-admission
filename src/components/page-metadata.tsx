type PageMetaDataProps = {
  title: string;
  description: string;
};

const PageMetaData = ({ title, description }: PageMetaDataProps) => {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
};

export default PageMetaData;
