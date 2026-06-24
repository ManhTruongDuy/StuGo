import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://truongduymanh2512:mJqpi6cVHDmHQaUC@stugo.4vkrmmg.mongodb.net/stugo?appName=StuGo')
  .then(async () => {
    const Transaction = (await import('./src/models/transaction.model.js')).default;
    const Booking = (await import('./src/models/booking.model.js')).default;
    
    const withdrawnAgg = await Transaction.aggregate([
        { $match: { type: 'withdrawal', status: { $in: ['pending', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const bookingRevenue = await Booking.aggregate([
        {
            $match: {
                status: { $in: ['confirmed', 'completed'] },
                paymentStatus: { $in: ['deposit_paid', 'fully_paid'] }
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: {
                        $cond: [
                            { $eq: ['$paymentStatus', 'fully_paid'] },
                            '$totalAmount',
                            '$depositAmount'
                        ]
                    }
                }
            }
        }
    ]);
    
    console.log('Withdrawn:', withdrawnAgg);
    console.log('Booking Revenue:', bookingRevenue);
    
    mongoose.connection.close();
  });
