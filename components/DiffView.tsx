import React from 'react';
import { DiffPart } from '../diff';

interface DiffViewProps {
  parts: DiffPart[];
}

const DiffView: React.FC<DiffViewProps> = ({ parts }) => {
  if (parts.length === 1 && !parts[0].added && !parts[0].removed) {
    return <>{parts[0].value}</>;
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.added) {
          return <ins key={index} className="bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100 rounded px-0.5 no-underline">{part.value}</ins>;
        }
        if (part.removed) {
          return <del key={index} className="bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100 rounded px-0.5">{part.value}</del>;
        }
        return <span key={index}>{part.value}</span>;
      })}
    </>
  );
};

export default DiffView;
