import React from 'react';
import { SectionHeadingProps } from './types';
import './SectionHeading.scss';

const SectionHeading = ({ children }: SectionHeadingProps) => (
  <h3 className="fbr-section-heading">{children}</h3>
);

export default SectionHeading;
