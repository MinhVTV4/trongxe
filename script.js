document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const tripListView = document.getElementById('trip-list-view');
    const tripDetailView = document.getElementById('trip-detail-view');

    // Trip List View elements
    const addTripForm = document.getElementById('add-trip-form');
    const tripListDiv = document.getElementById('trip-list');

    // Trip Detail View elements
    const backToListBtn = document.getElementById('back-to-list-btn');
    const detailTripTitle = document.getElementById('detail-trip-title');
    const tripSummaryCompactDiv = document.getElementById('trip-summary-compact');

    // Passenger Management elements
    const addPassengerToggleArea = document.getElementById('add-passenger-toggle-area');
    const showAddPassengerFormBtn = document.getElementById('show-add-passenger-form-btn');
    const addPassengerForm = document.getElementById('add-passenger-form');
    const cancelAddPassengerBtn = document.getElementById('cancel-add-passenger-btn');
    const passengerListDiv = document.getElementById('passenger-list');
    const currentTripIdInput = document.getElementById('current-trip-id');

    // Wake Lock elements
    const wakeLockButton = document.getElementById('wake-lock-button');
    const wakeLockStatus = document.getElementById('wake-lock-status');

    // Backup & Restore elements
    const backupButton = document.getElementById('backup-button');
    const restoreButton = document.getElementById('restore-button');
    const backupDataTextarea = document.getElementById('backup-data-textarea');
    const restoreStatus = document.getElementById('restore-status');

    const STORAGE_KEY = 'xeGhepTrips_v8'; // Key for version 8

    // === Wake Lock Logic ===
    let wakeLockSentinel = null;

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockSentinel = await navigator.wakeLock.request('screen');
                updateWakeLockStatus(true, "Đang giữ màn hình sáng.");
                wakeLockSentinel.addEventListener('release', () => {
                    updateWakeLockStatus(false, "Đã tắt giữ màn hình sáng.");
                    wakeLockSentinel = null;
                });
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
                updateWakeLockStatus(false, `Lỗi: ${err.message}`, true);
                wakeLockSentinel = null;
            }
        } else {
            updateWakeLockStatus(false, "Trình duyệt không hỗ trợ giữ màn hình sáng.", false, true);
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockSentinel !== null) {
            try {
                await wakeLockSentinel.release();
            } catch (err) {
                console.error(`Failed to release wake lock: ${err.name}, ${err.message}`);
                updateWakeLockStatus(false, "Lỗi khi tắt giữ sáng.", true);
                wakeLockSentinel = null;
            }
        }
    };

    const updateWakeLockStatus = (isActive, message, isError = false, isUnsupported = false) => {
        if (!wakeLockStatus || !wakeLockButton) return; // Thêm kiểm tra nếu element không tồn tại
        wakeLockStatus.textContent = message;
        wakeLockStatus.className = 'status-indicator';
        wakeLockButton.disabled = false;

        if (isActive) {
            wakeLockButton.classList.add('active');
            wakeLockButton.innerHTML = '<span class="icon">💡</span> Tắt giữ sáng';
            wakeLockStatus.classList.add('status-active');
        } else {
            wakeLockButton.classList.remove('active');
            wakeLockButton.innerHTML = '<span class="icon">💡</span> Giữ màn hình sáng';
            if (isError) {
                wakeLockStatus.classList.add('status-error');
            } else if (isUnsupported) {
                wakeLockStatus.classList.add('status-unsupported');
                wakeLockButton.disabled = true;
            }
        }
    };

    if (wakeLockButton) {
        wakeLockButton.addEventListener('click', () => {
            if (wakeLockSentinel === null) {
                requestWakeLock();
            } else {
                releaseWakeLock();
            }
        });
    }

    const handleVisibilityChange = () => {
        if (wakeLockSentinel !== null && document.visibilityState === 'hidden') {
             releaseWakeLock();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (!('wakeLock' in navigator)) {
         updateWakeLockStatus(false, "Trình duyệt không hỗ trợ giữ màn hình sáng.", false, true);
    }
    // === End Wake Lock Logic ===


    // === Data Handling ===
    function getTrips() {
        const tripsJson = localStorage.getItem(STORAGE_KEY);
        try {
            const trips = tripsJson ? JSON.parse(tripsJson) : [];
            // Đảm bảo trips luôn là một mảng
            if (!Array.isArray(trips)) {
                console.warn("Dữ liệu trong localStorage không phải là mảng, trả về mảng rỗng.");
                return [];
            }
            trips.sort((a, b) => {
                const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`);
                const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`);
                if (isNaN(dateTimeA.getTime())) return 1;
                if (isNaN(dateTimeB.getTime())) return -1;
                return dateTimeA - dateTimeB;
            });
            return trips;
        } catch (e) {
            console.error("Lỗi parse JSON từ localStorage:", e);
            localStorage.removeItem(STORAGE_KEY); // Xóa dữ liệu lỗi
            return [];
        }
    }

    function saveTrips(trips) {
        // Đảm bảo chỉ lưu mảng
        if (!Array.isArray(trips)) {
            console.error("Lỗi: Dữ liệu cần lưu không phải là mảng.");
            return;
        }
        try {
             localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
        } catch (e) {
            console.error("Lỗi khi lưu vào localStorage:", e);
            alert("Đã có lỗi xảy ra khi lưu dữ liệu. LocalStorage có thể đã đầy.");
        }
    }

    function findTripById(tripId) {
        const trips = getTrips();
        return trips.find(trip => trip.id === tripId);
    }

    // === View Switching & Form Toggling ===
    function showTripListView() {
        tripDetailView.classList.add('hidden');
        tripListView.classList.remove('hidden');
        displayTrips();
        window.scrollTo(0, 0);
    }

    function showTripDetailView(tripId) {
        const trip = findTripById(tripId);
        if (!trip) {
            alert('Không tìm thấy chuyến đi!');
            showTripListView();
            return;
        }
        detailTripTitle.textContent = `Chi tiết: ${trip.origin} → ${trip.destination}`;
        displayTripSummaryCompact(trip);
        displayPassengerList(trip.passengers, tripId);
        currentTripIdInput.value = tripId;
        hideAddPassengerForm();
        tripListView.classList.add('hidden');
        tripDetailView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    function showAddPassengerForm() {
        addPassengerToggleArea.classList.add('hidden');
        addPassengerForm.classList.remove('hidden');
        addPassengerForm.reset();
        addPassengerForm.querySelector('input[type="text"]')?.focus();
    }

    function hideAddPassengerForm() {
        addPassengerForm.classList.add('hidden');
        addPassengerToggleArea.classList.remove('hidden');
        addPassengerForm.reset();
    }


    // === Rendering Functions ===
    function displayTrips() {
        const trips = getTrips();
        tripListDiv.innerHTML = '';

        if (trips.length === 0) {
            tripListDiv.innerHTML = '<p>Chưa có chuyến đi nào được tạo.</p>';
            return;
        }

        trips.forEach(trip => {
            const tripElement = document.createElement('div');
            tripElement.classList.add('trip-item');
            tripElement.dataset.tripId = trip.id;

            const bookedSeats = calculateBookedSeats(trip);
            const availableSeats = trip.vehicleSeats - bookedSeats;
            const seatStatusColor = availableSeats <= 0 ? 'red' : (availableSeats < trip.vehicleSeats ? '#e08100' : 'green');

            tripElement.innerHTML = `
                <h3>${trip.origin} → ${trip.destination}</h3>
                <p><strong>Ngày:</strong> ${formatDate(trip.date)} lúc ${trip.time}</p>
                <p><strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> ${formatCurrency(trip.pricePerSeat)}/chỗ</p>
                <p><strong>Chỗ:</strong> <span style="color: red; font-weight: bold;">${bookedSeats}</span> / ${trip.vehicleSeats}
                   (Còn: <span style="color: ${seatStatusColor}; font-weight: bold;">${availableSeats}</span>)
                </p>
                ${trip.notes ? `<p><i>Ghi chú: ${trip.notes}</i></p>` : ''}
                <div class="trip-actions">
                    <button class="action-button manage-btn" data-trip-id="${trip.id}">Xem & Quản lý Khách</button>
                    <button class="action-button delete-btn" data-trip-id="${trip.id}">Xóa Chuyến</button>
                </div>
            `;
            tripListDiv.appendChild(tripElement);
        });
    }

    function displayTripSummaryCompact(trip) {
        const bookedSeats = calculateBookedSeats(trip);
        const availableSeats = trip.vehicleSeats - bookedSeats;

        let summaryHTML = `
            <div class="summary-item-label">Thời gian:</div>
            <div class="summary-item-value">${formatDate(trip.date)} - ${trip.time}</div>

            <div class="summary-item-label">Tình trạng chỗ:</div>
            <div class="summary-item-value">
                <span class="seat-booked">${bookedSeats}</span> / ${trip.vehicleSeats}
                (<span class="seat-available">${availableSeats}</span> trống)
            </div>

            <div class="summary-item-label">Giá vé:</div>
            <div class="summary-item-value">${formatCurrency(trip.pricePerSeat)} / chỗ</div>
        `;

        if (trip.notes) {
            summaryHTML += `
                <div class="summary-item-label">Ghi chú:</div>
                <div class="summary-item-value"><span class="trip-notes-value">${trip.notes}</span></div>
            `;
        }

        tripSummaryCompactDiv.innerHTML = summaryHTML;
    }


    function displayPassengerList(passengers, tripId) {
        passengerListDiv.innerHTML = '';
        if (!passengers || passengers.length === 0) {
             passengerListDiv.innerHTML = '<div class="passenger-item" style="border:none; justify-content: center; padding: 20px;">Chưa có hành khách nào cho chuyến này.</div>';
            return;
        }

        passengers.sort((a, b) => {
            const statusOrder = { 'booked': 1, 'picked_up': 2, 'dropped_off': 3, 'no_show': 4, 'cancelled': 5 };
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });

        passengers.forEach((passenger) => {
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item');
            if (passenger.status === 'picked_up') {
                passengerElement.classList.add('picked-up');
            }

            const mapSearchUrl = "https://www.google.com/maps/search/?api=1&query=";
            const mapLinkPickup = `${mapSearchUrl}${encodeURIComponent(passenger.pickupAddress)}`;
            const mapLinkDropoff = `${mapSearchUrl}${encodeURIComponent(passenger.dropoffAddress)}`;

            const { statusText, statusClass } = getStatusInfo(passenger.status);
            const passengerIdentifier = `data-passenger-name="${passenger.name}" data-passenger-contact="${passenger.contact}"`;

            passengerElement.innerHTML = `
                <div class="col-name">
                    ${passenger.name}
                    <span class="seat-count">(${passenger.seatsBooked} chỗ)</span>
                    ${passenger.notes ? `<i title="${passenger.notes}">Ghi chú: ${passenger.notes}</i>` : ''}
                    <button class="delete-passenger-x-btn" title="Xóa khách này" data-trip-id="${tripId}" ${passengerIdentifier}>×</button>
                </div>
                <div class="col-contact">
                    <a href="tel:${passenger.contact}" title="Gọi ${passenger.name}"><span class="icon icon-phone">☎</span> ${passenger.contact}</a>
                </div>
                <div class="col-pickup">
                    ${passenger.pickupAddress}
                    <a href="${mapLinkPickup}" target="_blank" title="Xem bản đồ điểm đón"><span class="icon icon-map">📍</span></a>
                </div>
                <div class="col-dropoff">
                    ${passenger.dropoffAddress}
                    <a href="${mapLinkDropoff}" target="_blank" title="Xem bản đồ điểm trả"><span class="icon icon-map">📍</span></a>
                </div>
                <div class="col-status">
                    <span class="passenger-status ${statusClass}">${statusText}</span>
                </div>
                <div class="col-actions">
                    ${passenger.status === 'booked' ? `<button class="status-update-btn btn-pickup" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="picked_up" title="Đánh dấu đã đón"><span class="icon">👍</span> Đón</button>` : ''}
                    ${passenger.status === 'picked_up' ? `<button class="status-update-btn btn-dropoff" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="dropped_off" title="Đánh dấu đã trả"><span class="icon">🏁</span> Trả</button>` : ''}
                    ${passenger.status !== 'dropped_off' && passenger.status !== 'cancelled' ? `<button class="status-update-btn btn-cancel" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="cancelled" title="Hủy chỗ của khách này"><span class="icon">❌</span> Hủy</button>` : ''}
                    ${passenger.status === 'booked' || passenger.status === 'picked_up' ? `<button class="status-update-btn btn-noshow" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="no_show" title="Đánh dấu khách không đến"><span class="icon">👻</span> Ko đến</button>` : ''}
                </div>
            `;
            passengerListDiv.appendChild(passengerElement);
        });
    }


    // === Helper Functions ===
    function calculateBookedSeats(trip) {
        if (!trip || !Array.isArray(trip.passengers)) return 0; // Thêm kiểm tra
        return trip.passengers.reduce((sum, p) => (p.status !== 'cancelled' && p.status !== 'no_show') ? sum + p.seatsBooked : sum, 0);
    }

    function formatCurrency(amount) {
        if (isNaN(amount)) return "N/A";
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    function formatDate(dateString) {
         if (!dateString) return "N/A";
        try {
            const [year, month, day] = dateString.split('-');
            if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) {
                 throw new Error("Invalid date format (YYYY-MM-DD expected)");
            }
             const date = new Date(year, month - 1, day);
             if (isNaN(date.getTime()) || date.getFullYear() !== parseInt(year) || date.getMonth() !== parseInt(month) - 1 || date.getDate() !== parseInt(day)) {
                 throw new Error("Invalid date value");
             }
            return `${day}/${month}/${year}`;
        } catch (e) {
            console.error("Lỗi định dạng ngày:", dateString, e);
            return dateString;
        }
    }

    function getStatusInfo(status) {
        switch (status) {
            case 'booked': return { statusText: 'Đã đặt', statusClass: 'status-booked' };
            case 'picked_up': return { statusText: 'Đã đón', statusClass: 'status-picked_up' };
            case 'dropped_off': return { statusText: 'Đã trả', statusClass: 'status-dropped_off' };
            case 'cancelled': return { statusText: 'Đã hủy', statusClass: 'status-cancelled' };
            case 'no_show': return { statusText: 'Không đến', statusClass: 'status-no_show' };
            default: return { statusText: status || 'N/A', statusClass: '' };
        }
    }

    // === Backup & Restore Functions ===
    function backupData() {
        const trips = getTrips();
        if (trips.length === 0) {
            backupDataTextarea.value = ""; // Xóa trắng nếu không có dữ liệu
            alert("Không có dữ liệu chuyến đi nào để sao lưu.");
            return;
        }
        try {
            // Sử dụng null, 2 để format JSON cho dễ đọc
            const backupJson = JSON.stringify(trips, null, 2);
            backupDataTextarea.value = backupJson;
            backupDataTextarea.select(); // Tự động chọn text để dễ copy
            // Không cần thông báo alert ở đây, người dùng tự copy
            restoreStatus.textContent = "Dữ liệu đã được hiển thị trong ô. Hãy sao chép và lưu lại.";
            restoreStatus.className = 'status-indicator'; // Reset class
        } catch (e) {
            console.error("Lỗi khi tạo JSON sao lưu:", e);
            alert("Đã có lỗi xảy ra khi tạo dữ liệu sao lưu.");
            restoreStatus.textContent = "Lỗi khi tạo dữ liệu sao lưu.";
            restoreStatus.className = 'status-indicator status-error';
        }
    }

    function restoreData() {
        const backupJson = backupDataTextarea.value.trim();
        if (!backupJson) {
            alert("Vui lòng dán dữ liệu đã sao lưu vào ô trước khi khôi phục.");
            return;
        }

        if (!confirm("CẢNH BÁO: Hành động này sẽ XÓA SẠCH toàn bộ dữ liệu chuyến đi hiện tại và thay thế bằng dữ liệu khôi phục. Bạn có chắc chắn muốn tiếp tục?")) {
            return;
        }

        try {
            const restoredTrips = JSON.parse(backupJson);

            // Kiểm tra cơ bản xem dữ liệu có phải là mảng không
            if (!Array.isArray(restoredTrips)) {
                throw new Error("Dữ liệu khôi phục không hợp lệ (không phải là một danh sách).");
            }

            // (Tùy chọn) Có thể thêm kiểm tra sâu hơn cấu trúc dữ liệu ở đây

            saveTrips(restoredTrips); // Lưu dữ liệu đã khôi phục
            showTripListView(); // Hiển thị lại danh sách chính
            backupDataTextarea.value = ""; // Xóa ô nhập sau khi khôi phục
            restoreStatus.textContent = "Khôi phục dữ liệu thành công!";
            restoreStatus.className = 'status-indicator status-success';

        } catch (e) {
            console.error("Lỗi khi khôi phục dữ liệu:", e);
            alert(`Đã có lỗi xảy ra khi khôi phục dữ liệu: ${e.message}. Vui lòng kiểm tra lại dữ liệu đã dán.`);
            restoreStatus.textContent = `Lỗi khôi phục: ${e.message}`;
            restoreStatus.className = 'status-indicator status-error';
        }
    }
    // === End Backup & Restore Functions ===


    // === Event Listeners ===

    // 1. Add New Trip (Giữ nguyên)
    addTripForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newTrip = { id: Date.now().toString() + Math.random().toString(36).substring(2, 8), origin: document.getElementById('trip-origin').value.trim(), destination: document.getElementById('trip-destination').value.trim(), date: document.getElementById('trip-date').value, time: document.getElementById('trip-time').value, vehicleSeats: parseInt(document.getElementById('vehicle-seats').value), pricePerSeat: parseInt(document.getElementById('price-per-seat').value), notes: document.getElementById('trip-notes').value.trim(), passengers: [] };
        if (!newTrip.date || formatDate(newTrip.date) === newTrip.date) { alert('Ngày đi không hợp lệ. Vui lòng chọn lại.'); return; }
        if (!newTrip.origin || !newTrip.destination || !newTrip.time || isNaN(newTrip.vehicleSeats) || newTrip.vehicleSeats <= 0 || isNaN(newTrip.pricePerSeat)) { alert('Vui lòng nhập đầy đủ thông tin hợp lệ cho chuyến đi.'); return; }
        const trips = getTrips(); trips.push(newTrip); saveTrips(trips); addTripForm.reset(); displayTrips();
    });

    // 2. Click on Trip List (Manage/Delete Trip) (Giữ nguyên)
    tripListDiv.addEventListener('click', (event) => {
        const target = event.target.closest('button'); if (!target) return; const tripId = target.dataset.tripId; if (!tripId) return;
        if (target.classList.contains('manage-btn')) { showTripDetailView(tripId); }
        else if (target.classList.contains('delete-btn')) {
            const trip = findTripById(tripId); const tripName = trip ? `${trip.origin} → ${trip.destination} (${formatDate(trip.date)})` : "chuyến đi này";
            if (confirm(`Bạn có chắc muốn xóa "${tripName}" và toàn bộ thông tin hành khách? Hành động này không thể hoàn tác.`)) { let trips = getTrips(); trips = trips.filter(trip => trip.id !== tripId); saveTrips(trips); displayTrips(); }
        }
    });

    // 3. Back to List from Detail View (Giữ nguyên)
    backToListBtn.addEventListener('click', showTripListView);

    // 4. Show Add Passenger Form (Giữ nguyên)
    showAddPassengerFormBtn.addEventListener('click', showAddPassengerForm);

    // 5. Cancel Adding Passenger (Giữ nguyên)
    cancelAddPassengerBtn.addEventListener('click', (event) => { event.preventDefault(); hideAddPassengerForm(); });

    // 6. Submit Add Passenger Form (Giữ nguyên)
    addPassengerForm.addEventListener('submit', (event) => {
        event.preventDefault(); const tripId = currentTripIdInput.value; if (!tripId) return; const trip = findTripById(tripId); if (!trip) { alert('Lỗi: Không tìm thấy chuyến đi.'); return; }
        const passengerName = document.getElementById('passenger-name').value.trim(); const passengerContact = document.getElementById('passenger-contact').value.trim(); const seatsBooked = parseInt(document.getElementById('passenger-seats').value); const pickupAddress = document.getElementById('passenger-pickup').value.trim(); const dropoffAddress = document.getElementById('passenger-dropoff').value.trim(); const passengerNotes = document.getElementById('passenger-notes').value.trim();
        if (!passengerName || !passengerContact || isNaN(seatsBooked) || seatsBooked <= 0 || !pickupAddress || !dropoffAddress) { alert('Vui lòng nhập đầy đủ thông tin khách hàng (tên, SĐT, số chỗ, điểm đón, điểm trả).'); return; }
        const currentBookedSeats = calculateBookedSeats(trip); if (currentBookedSeats + seatsBooked > trip.vehicleSeats) { alert(`Không đủ chỗ! Chỉ còn ${trip.vehicleSeats - currentBookedSeats} chỗ trống.`); return; }
        const newPassenger = { name: passengerName, contact: passengerContact, seatsBooked: seatsBooked, pickupAddress: pickupAddress, dropoffAddress: dropoffAddress, notes: passengerNotes, status: 'booked' };
        let trips = getTrips(); const tripIndex = trips.findIndex(t => t.id === tripId);
        if (tripIndex > -1) {
             const existingPassenger = trips[tripIndex].passengers.find(p => p.name === newPassenger.name && p.contact === newPassenger.contact && p.status !== 'cancelled');
             if (existingPassenger) { if (!confirm(`Khách hàng "${newPassenger.name}" (${newPassenger.contact}) đã tồn tại trong chuyến này và chưa bị hủy. Bạn vẫn muốn thêm lượt đặt mới?`)){ hideAddPassengerForm(); return; } }
            trips[tripIndex].passengers.push(newPassenger); saveTrips(trips); displayPassengerList(trips[tripIndex].passengers, tripId); displayTripSummaryCompact(trips[tripIndex]); hideAddPassengerForm();
        } else { alert('Lỗi: Không tìm thấy chuyến đi để cập nhật.'); }
    });

     // 7. Click on Passenger List (Update Status / Delete Passenger) (Giữ nguyên logic Giai đoạn 1)
     passengerListDiv.addEventListener('click', (event) => {
         const target = event.target.closest('button'); if (!target) return;
         const tripId = target.dataset.tripId; const passengerName = target.dataset.passengerName; const passengerContact = target.dataset.passengerContact;
         if (!tripId || passengerName === undefined || passengerContact === undefined) return;
         let trips = getTrips(); const tripIndex = trips.findIndex(t => t.id === tripId); if (tripIndex === -1) { console.error("Lỗi: Không tìm thấy chuyến đi."); return; }
         const passengerIndex = trips[tripIndex].passengers.findIndex(p => p.name === passengerName && p.contact === passengerContact);
         if (passengerIndex === -1) { console.warn("Cảnh báo: Không tìm thấy hành khách."); showTripDetailView(tripId); return; }
         let needsSummaryUpdate = false;
         if (target.classList.contains('delete-passenger-x-btn')) {
             if (confirm(`Bạn có chắc muốn xóa hành khách "${passengerName}" (${passengerContact})?`)) {
                 if (trips[tripIndex].passengers[passengerIndex].status !== 'cancelled' && trips[tripIndex].passengers[passengerIndex].status !== 'no_show') { needsSummaryUpdate = true; }
                 trips[tripIndex].passengers.splice(passengerIndex, 1); saveTrips(trips); displayPassengerList(trips[tripIndex].passengers, tripId);
                 if (needsSummaryUpdate) { displayTripSummaryCompact(trips[tripIndex]); }
             }
         }
         else if (target.classList.contains('status-update-btn')) {
             const newStatus = target.dataset.newStatus; const oldStatus = trips[tripIndex].passengers[passengerIndex].status; const validStatuses = ['booked', 'picked_up', 'dropped_off', 'cancelled', 'no_show'];
             if (newStatus && validStatuses.includes(newStatus) && newStatus !== oldStatus) {
                 if ((oldStatus !== 'cancelled' && oldStatus !== 'no_show') !== (newStatus !== 'cancelled' && newStatus !== 'no_show')) { needsSummaryUpdate = true; }
                 trips[tripIndex].passengers[passengerIndex].status = newStatus; saveTrips(trips); displayPassengerList(trips[tripIndex].passengers, tripId);
                 if (needsSummaryUpdate) { displayTripSummaryCompact(trips[tripIndex]); }
             } else if (!newStatus || !validStatuses.includes(newStatus)) { console.warn("Trạng thái mới không hợp lệ:", newStatus); }
         }
     });

    // 8. Backup Button Listener
    if (backupButton) {
        backupButton.addEventListener('click', backupData);
    }

    // 9. Restore Button Listener
    if (restoreButton) {
        restoreButton.addEventListener('click', restoreData);
    }

    // === Initial Load ===
    showTripListView();

}); // End DOMContentLoaded
