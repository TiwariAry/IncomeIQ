import React from 'react';
import { UserCircle } from 'lucide-react';

const ProfileView = ({ user, alerts, strategies, activityLog }) => (
    <div className="app-container profile-view">
        <div className="profile-header"><h1 className="page-title"><UserCircle size={40} /> User Profile</h1></div>
        <div className="profile-content glass-card">
            <div className="profile-avatar"><UserCircle size={100} /></div>
            <div className="profile-details">
                <div className="profile-field"><span className="profile-label">Name</span><span className="profile-value">{user?.name}</span></div>
                <div className="profile-field"><span className="profile-label">Email</span><span className="profile-value">{user?.email}</span></div>
                <div className="profile-field"><span className="profile-label">Member Since</span><span className="profile-value">{new Date(user?.joinedDate).toLocaleDateString()}</span></div>
                <div className="profile-field"><span className="profile-label">Active Alerts</span><span className="profile-value">{alerts.filter(a => a.enabled).length}</span></div>
                <div className="profile-field"><span className="profile-label">Strategies Generated</span><span className="profile-value">{strategies.length}</span></div>
                <div className="profile-field"><span className="profile-label">Total Activities</span><span className="profile-value">{activityLog.length}</span></div>
            </div>
        </div>
    </div>
);

export default ProfileView;