import React, { useState } from 'react';
import { Eye, Activity, Brain, Bell, User, Sparkles, ChevronDown, X } from 'lucide-react';

const ActivityView = ({ activityLog }) => {
    const [selectedActivity, setSelectedActivity] = useState(null);

    return (
        <div className="app-container">
            <div className="activity-header"><h1 className="page-title"><Eye size={40} /> Recent Activity</h1></div>
            <div className="activity-content-wrapper">
                <div className="activity-timeline-card glass-card">
                    <h2 className="card-title">Activity Timeline</h2>
                    {activityLog.length === 0 ? (
                        <div className="empty-state"><Activity size={48} className="empty-icon" /><p>No recent activity</p></div>
                    ) : (
                        <div className="activity-timeline">
                            {activityLog.map((activity) => (
                                <div key={activity.id} className={`activity-item ${selectedActivity?.id === activity.id ? 'selected' : ''}`} onClick={() => setSelectedActivity(activity)}>
                                    <div className="activity-icon">
                                        {activity.type === 'strategy' && <Brain size={24} />}
                                        {activity.type === 'alert' && <Bell size={24} />}
                                        {activity.type === 'auth' && <User size={24} />}
                                        {activity.type === 'explanation' && <Sparkles size={24} />}
                                    </div>
                                    <div className="activity-details">
                                        <div className="activity-title">{activity.title}</div>
                                        <div className="activity-description">{activity.description}</div>
                                    </div>
                                    <ChevronDown className="activity-chevron" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedActivity && (
                    <div className="activity-details-card glass-card">
                        <div className="activity-details-header">
                            <h2 className="card-title">Activity Details</h2>
                            <button type="button" className="close-details-btn" onClick={() => setSelectedActivity(null)}><X size={20} /></button>
                        </div>
                        <div className="activity-details-content">
                            <div className="detail-row"><span className="detail-label">Type:</span><span className="detail-value">{selectedActivity.type.toUpperCase()}</span></div>
                            <div className="detail-row"><span className="detail-label">Title:</span><span className="detail-value">{selectedActivity.title}</span></div>
                            <div className="detail-row"><span className="detail-label">Description:</span><span className="detail-value">{selectedActivity.description}</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityView;