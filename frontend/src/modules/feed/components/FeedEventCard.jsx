import React from 'react';
import PublicationFeedCard from './PublicationFeedCard';
import ResearcherFeedCard from './ResearcherFeedCard';
import ConferenceFeedCard from './ConferenceFeedCard';
import FundingFeedCard from './FundingFeedCard';
import DatasetFeedCard from './DatasetFeedCard';
import JobFeedCard from './JobFeedCard';
import AnnouncementFeedCard from './AnnouncementFeedCard';

/**
 * FeedEventCard — Router component.
 * Inspects the event's entityType and eventType, then renders the
 * appropriate specialized card. Falls back to PublicationFeedCard.
 */
const FeedEventCard = ({ event, onInteraction }) => {
  if (!event) return null;

  const { eventType, entityType } = event;

  // Publication events
  if (
    entityType === 'Publication' ||
    eventType === 'publication_uploaded' ||
    eventType === 'publication_updated' ||
    eventType === 'citation_increased'
  ) {
    return <PublicationFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Researcher follow/suggestion events
  if (
    entityType === 'User' ||
    eventType === 'researcher_followed' ||
    eventType === 'achievement' ||
    eventType === 'award'
  ) {
    return <ResearcherFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Conference events
  if (
    entityType === 'Conference' ||
    eventType === 'conference_joined' ||
    eventType === 'conference_deadline'
  ) {
    return <ConferenceFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Funding opportunities
  if (
    entityType === 'FundingOpportunity' ||
    eventType === 'funding_opportunity'
  ) {
    return <FundingFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Dataset uploads
  if (
    entityType === 'Dataset' ||
    eventType === 'dataset_uploaded'
  ) {
    return <DatasetFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Academic job postings
  if (
    entityType === 'AcademicJob' ||
    eventType === 'academic_job'
  ) {
    return <JobFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Announcements (collaboration)
  if (
    entityType === 'Announcement' ||
    eventType === 'milestone'
  ) {
    return <AnnouncementFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Research questions, answers, collaborations
  if (
    entityType === 'ResearchQuestion' ||
    eventType === 'research_question' ||
    eventType === 'research_answer' ||
    eventType === 'research_collaboration'
  ) {
    return <AnnouncementFeedCard event={event} onInteraction={onInteraction} />;
  }

  // Default fallback
  return <PublicationFeedCard event={event} onInteraction={onInteraction} />;
};

export default FeedEventCard;
