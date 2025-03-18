import express from 'express'
import {
    ParseWebhookEvent,
    parseWebhookEvent,
    verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";
import {
    deleteUserNotificationDetails,
    setUserNotificationDetails,
} from "../lib/kv";


const app = express()

app.get('/', function (req, res) {
    res.send('Hello cool')
})

app.post('/webhook', async function (request, response) {
    const requestJson = request.body;

    console.log(requestJson, "request json");

    let data;
    try {
        data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
        console.log(data, "parsed webhook event");
    } catch (e: unknown) {
        const error = e as ParseWebhookEvent.ErrorType;

        switch (error.name) {
            case "VerifyJsonFarcasterSignature.InvalidDataError":
            case "VerifyJsonFarcasterSignature.InvalidEventDataError":
                // The request data is invalid
                response.status(400).json({ success: false, error: error.message });
                return;
            case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
                // The app key is invalid
                response.status(401).json({ success: false, error: error.message });
                return;
            case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
                // Internal error verifying the app key (caller may want to try again)
                response.status(500).json({ success: false, error: error.message });
                return;
        }
    }

    const fid = data.fid;
    const event = data.event;

    console.log(event, "event");

    switch (event.event) {
        case "frame_added":
            if (event.notificationDetails) {
                await setUserNotificationDetails(fid, event.notificationDetails);
                // const addNotif = await sendFrameNotification({
                //     fid,
                //     title: "Welcome,now you got a space to Yap",
                //     body: "start yapping with your Farcaster frens",
                // });
                // console.log(addNotif, "addNotif");
            } else {
                const removeNotif = await deleteUserNotificationDetails(fid);
                console.log(removeNotif, "removeNotif");
            }

            break;
        case "frame_removed":
            await deleteUserNotificationDetails(fid);

            break;
        case "notifications_enabled":
            await setUserNotificationDetails(fid, event.notificationDetails);
            // await sendFrameNotification({
            //     fid,
            //     title: "Pov Yapster: :)",
            //     body: "Sed to see you disable notifications",
            // });

            break;
        case "notifications_disabled":
            await deleteUserNotificationDetails(fid);

            break;
    }

    response.status(200).json({ success: true });
})

app.listen(3000, function () {
    console.log('Running mAcrodata')
})

module.exports = app;

