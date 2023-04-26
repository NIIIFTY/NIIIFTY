const Figure = ({
  title,
  img,
  video,
  children,
}: {
  title: string;
  img?: string | undefined;
  video?: string | undefined;
  children?: React.ReactNode;
}) => {
  return (
    <figure>
      {img && <img alt={title} src={img} loading="lazy" />}
      {video && (
        <video title={title} loop autoPlay muted playsInline src={video} />
      )}
      {children && <figcaption>{children}</figcaption>}
    </figure>
  );
};

export default Figure;
