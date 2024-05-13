import React, { useRef, useState, useEffect } from "react";
import './Card.scss';

type CardProps = {
  dataImage: string;
  header: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  cardClass?: string;
  info?: string;
  starter: number;
  onClick?: () => void;
};

const ProfilCard: React.FC<CardProps> = ({ dataImage, header, content, className, cardClass, info, starter }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mouse, setMouse] = useState({ x: starter, y: 0 });
  const [offset, setOffset] = useState({x: (starter === 0 ? 0 : (starter === 100 ? 8 : -8)), y: 0});

  useEffect(() => {
    if (cardRef.current) {
      setDimensions({
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
      });
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const rect = cardRef.current!.getBoundingClientRect();

    const xWithinCard = mouseX - rect.left;
    const yWithinCard = mouseY - rect.top;

    const dw = dimensions.width / 2;
    const dh = dimensions.height / 2;
    const xFinal = xWithinCard - dw;
    const yFinal = yWithinCard - dh;

    const xScaleFactor = (6 - -6) / (dw - -dw);
    const yScaleFactor = (5 - -5) / (dh - -dh);

    const xOff = (xFinal - -dw) * xScaleFactor + -5;
    const yOff = (yFinal - -dh) * yScaleFactor + -5;

    setOffset({x: xOff, y: -yOff});
    setMouse({x: xFinal, y: yFinal});
  };

  const handleMouseLeave = () => {
    setMouse({ x: starter, y: 0 });
	setOffset({ x: (starter === 0 ? 0 : (starter === 100 ? 8 : -8)), y: 0 });
  };

  const mousePX = mouse.x / dimensions.width;
  const mousePY = mouse.y / dimensions.height;

  const cardStyle = {
    scale: `${starter === 0 ? '105%' : '100%'}`,
    transform: `rotateY(${mousePX * 30}deg) rotateX(${mousePY * -30}deg)`,
  };

  const cardBgStyle = {
    backgroundImage: `url(${dataImage})`,
	top: `${offset.y}%`,
	left: `${offset.x}%`,
    transform: `translateX(${mousePX * -40}px) translateY(${mousePY * 40}px)`,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card-wrap ${className}`}
    >
      <div className={`card ${cardClass}`} style={cardStyle}>
        <div className="card-bg" style={cardBgStyle}></div>
        <div className={`card-info ${info}`}>
          {header}
          {content}
        </div>
      </div>
    </div>
  );
};

export default ProfilCard;
