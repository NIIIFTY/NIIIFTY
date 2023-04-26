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
  function titleToAnchor() {
    return title.toLowerCase().replace(/ /g, "-");
  }

  return (
    <figure>
      {img && (
        <a id={titleToAnchor()} href={`#${titleToAnchor()}`}>
          <img alt={title} src={img} loading="lazy" />
        </a>
      )}
      {video && (
        <video title={title} loop autoPlay muted playsInline src={video} />
      )}
      {children && <figcaption>{children}</figcaption>}
    </figure>
  );
};

export default Figure;
